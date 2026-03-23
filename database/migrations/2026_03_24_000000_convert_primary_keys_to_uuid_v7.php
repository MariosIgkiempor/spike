<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Skip if already using UUID PKs (e.g., migrate:fresh with updated migrations)
        $type = Schema::getColumnType('users', 'id');
        if ($type !== 'integer') {
            return;
        }

        $driver = DB::connection()->getDriverName();

        if ($driver === 'sqlite') {
            $this->migrateSqlite();
        } else {
            $this->migrateMysql();
        }
    }

    public function down(): void
    {
        // Reversal is impractical — original auto-increment IDs are lost.
        // Restore from database backup instead.
    }

    // ──────────────────────────────────────────────
    // Shared helpers
    // ──────────────────────────────────────────────

    private function createUuidMapTable(): void
    {
        DB::statement('CREATE TABLE _uuid_map (
            entity VARCHAR(50) NOT NULL,
            old_id BIGINT NOT NULL,
            new_uuid CHAR(36) NOT NULL,
            PRIMARY KEY (entity, old_id)
        )');
    }

    private function dropUuidMapTable(): void
    {
        DB::statement('DROP TABLE IF EXISTS _uuid_map');
    }

    private function generateUuidsForTable(string $entity): void
    {
        $rows = DB::table($entity)->select('id')->orderBy('id')->get();
        foreach ($rows as $row) {
            DB::table('_uuid_map')->insert([
                'entity' => $entity,
                'old_id' => $row->id,
                'new_uuid' => (string) Str::uuid7(),
            ]);
        }
    }

    private function getUuid(string $entity, int|string $oldId): ?string
    {
        return DB::table('_uuid_map')
            ->where('entity', $entity)
            ->where('old_id', $oldId)
            ->value('new_uuid');
    }

    private function resolveEntityFromMorphType(string $morphType): ?string
    {
        return match ($morphType) {
            'App\\Models\\Game' => 'games',
            'App\\Models\\User' => 'users',
            'App\\Models\\League' => 'leagues',
            'App\\Models\\Team' => 'teams',
            'App\\Models\\Season' => 'seasons',
            default => null,
        };
    }

    // ──────────────────────────────────────────────
    // MySQL strategy
    // ──────────────────────────────────────────────

    private function migrateMysql(): void
    {
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        $this->createUuidMapTable();

        // Generate UUIDs for all model tables
        foreach (['users', 'leagues', 'seasons', 'games', 'teams'] as $table) {
            $this->generateUuidsForTable($table);
        }

        // Convert model table PKs
        $this->mysqlConvertPk('users');
        $this->mysqlConvertPk('leagues');
        $this->mysqlConvertPk('seasons');
        $this->mysqlConvertPk('games');
        $this->mysqlConvertPk('teams');

        // Convert FK columns on model tables
        $this->mysqlConvertFk('leagues', 'user_id', 'users');
        $this->mysqlConvertFk('seasons', 'league_id', 'leagues');
        $this->mysqlConvertFk('games', 'league_id', 'leagues');
        $this->mysqlConvertFk('games', 'season_id', 'seasons', nullable: true);

        // Convert FK columns on pivot tables
        $this->mysqlConvertFk('league_user', 'user_id', 'users');
        $this->mysqlConvertFk('league_user', 'league_id', 'leagues');
        $this->mysqlConvertFk('game_team', 'game_id', 'games');
        $this->mysqlConvertFk('game_team', 'team_id', 'teams');
        $this->mysqlConvertFk('team_user', 'user_id', 'users');
        $this->mysqlConvertFk('team_user', 'team_id', 'teams');

        // Convert sessions.user_id (no FK constraint)
        $this->mysqlConvertFk('sessions', 'user_id', 'users', nullable: true);

        // Convert media.model_id (polymorphic)
        $this->mysqlConvertMediaModelId();

        $this->dropUuidMapTable();

        DB::statement('SET FOREIGN_KEY_CHECKS = 1');
    }

    private function mysqlConvertPk(string $table): void
    {
        // Add new UUID column
        DB::statement("ALTER TABLE `{$table}` ADD COLUMN `new_id` CHAR(36) NOT NULL AFTER `id`");

        // Populate from map
        DB::statement("
            UPDATE `{$table}` t
            JOIN `_uuid_map` m ON m.entity = '{$table}' AND m.old_id = t.id
            SET t.new_id = m.new_uuid
        ");

        // Swap: remove auto_increment, drop old PK, drop old column, rename, add new PK
        DB::statement("ALTER TABLE `{$table}` MODIFY `id` BIGINT UNSIGNED NOT NULL");
        DB::statement("ALTER TABLE `{$table}` DROP PRIMARY KEY");
        DB::statement("ALTER TABLE `{$table}` DROP COLUMN `id`");
        DB::statement("ALTER TABLE `{$table}` CHANGE `new_id` `id` CHAR(36) NOT NULL");
        DB::statement("ALTER TABLE `{$table}` ADD PRIMARY KEY (`id`)");
    }

    private function mysqlConvertFk(string $table, string $column, string $referencedEntity, bool $nullable = false): void
    {
        $nullClause = $nullable ? '' : 'NOT NULL';
        $newCol = "new_{$column}";

        // Add new column
        DB::statement("ALTER TABLE `{$table}` ADD COLUMN `{$newCol}` CHAR(36) {$nullClause} AFTER `{$column}`");

        // Populate via map
        if ($nullable) {
            DB::statement("
                UPDATE `{$table}` t
                LEFT JOIN `_uuid_map` m ON m.entity = '{$referencedEntity}' AND m.old_id = t.`{$column}`
                SET t.`{$newCol}` = m.new_uuid
                WHERE t.`{$column}` IS NOT NULL
            ");
        } else {
            DB::statement("
                UPDATE `{$table}` t
                JOIN `_uuid_map` m ON m.entity = '{$referencedEntity}' AND m.old_id = t.`{$column}`
                SET t.`{$newCol}` = m.new_uuid
            ");
        }

        // Drop old, rename new
        DB::statement("ALTER TABLE `{$table}` DROP COLUMN `{$column}`");
        DB::statement("ALTER TABLE `{$table}` CHANGE `{$newCol}` `{$column}` CHAR(36) {$nullClause}");
    }

    private function mysqlConvertMediaModelId(): void
    {
        DB::statement('ALTER TABLE `media` ADD COLUMN `new_model_id` CHAR(36) NOT NULL AFTER `model_id`');

        // Map model_id using entity derived from model_type
        $rows = DB::table('media')->select('id', 'model_type', 'model_id')->get();
        foreach ($rows as $row) {
            $entity = $this->resolveEntityFromMorphType($row->model_type);
            $newId = $entity ? $this->getUuid($entity, $row->model_id) : $row->model_id;
            DB::table('media')->where('id', $row->id)->update(['new_model_id' => $newId]);
        }

        DB::statement('ALTER TABLE `media` DROP COLUMN `model_id`');
        DB::statement('ALTER TABLE `media` CHANGE `new_model_id` `model_id` CHAR(36) NOT NULL');
    }

    // ──────────────────────────────────────────────
    // SQLite strategy
    // ──────────────────────────────────────────────

    private function migrateSqlite(): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');

        $this->createUuidMapTable();

        foreach (['users', 'leagues', 'seasons', 'games', 'teams'] as $table) {
            $this->generateUuidsForTable($table);
        }

        $this->sqliteRecreateUsers();
        $this->sqliteRecreateLeagues();
        $this->sqliteRecreateSeasons();
        $this->sqliteRecreateGames();
        $this->sqliteRecreateTeams();
        $this->sqliteRecreateLeagueUser();
        $this->sqliteRecreateGameTeam();
        $this->sqliteRecreateTeamUser();
        $this->sqliteRecreateSessions();
        $this->sqliteRecreateMedia();

        $this->dropUuidMapTable();

        DB::statement('PRAGMA foreign_keys = ON');
    }

    private function sqliteRecreateUsers(): void
    {
        DB::statement('ALTER TABLE users RENAME TO _old_users');

        DB::statement('CREATE TABLE users (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            email_verified_at DATETIME,
            password VARCHAR(255),
            avatar_url VARCHAR(255),
            games_played INTEGER NOT NULL DEFAULT 0,
            games_won INTEGER NOT NULL DEFAULT 0,
            remember_token VARCHAR(100),
            created_at DATETIME,
            updated_at DATETIME
        )');

        $rows = DB::table('_old_users')->get();
        foreach ($rows as $row) {
            DB::table('users')->insert([
                'id' => $this->getUuid('users', $row->id),
                'name' => $row->name,
                'email' => $row->email,
                'email_verified_at' => $row->email_verified_at,
                'password' => $row->password,
                'avatar_url' => $row->avatar_url ?? null,
                'games_played' => $row->games_played,
                'games_won' => $row->games_won,
                'remember_token' => $row->remember_token,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        DB::statement('DROP TABLE _old_users');
    }

    private function sqliteRecreateLeagues(): void
    {
        DB::statement('ALTER TABLE leagues RENAME TO _old_leagues');

        DB::statement('CREATE TABLE leagues (
            id CHAR(36) NOT NULL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            user_id CHAR(36) NOT NULL,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )');

        $rows = DB::table('_old_leagues')->get();
        foreach ($rows as $row) {
            DB::table('leagues')->insert([
                'id' => $this->getUuid('leagues', $row->id),
                'name' => $row->name,
                'user_id' => $this->getUuid('users', $row->user_id),
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        DB::statement('DROP TABLE _old_leagues');
    }

    private function sqliteRecreateSeasons(): void
    {
        DB::statement('ALTER TABLE seasons RENAME TO _old_seasons');

        DB::statement('CREATE TABLE seasons (
            id CHAR(36) NOT NULL PRIMARY KEY,
            league_id CHAR(36) NOT NULL,
            number INTEGER NOT NULL,
            custom_name VARCHAR(255),
            is_active INTEGER NOT NULL DEFAULT 0,
            started_at DATETIME NOT NULL,
            ended_at DATETIME,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (league_id) REFERENCES leagues(id) ON DELETE CASCADE
        )');

        DB::statement('CREATE UNIQUE INDEX seasons_league_id_number_unique ON seasons (league_id, number)');
        DB::statement('CREATE INDEX seasons_league_id_is_active_index ON seasons (league_id, is_active)');

        $rows = DB::table('_old_seasons')->get();
        foreach ($rows as $row) {
            DB::table('seasons')->insert([
                'id' => $this->getUuid('seasons', $row->id),
                'league_id' => $this->getUuid('leagues', $row->league_id),
                'number' => $row->number,
                'custom_name' => $row->custom_name,
                'is_active' => $row->is_active,
                'started_at' => $row->started_at,
                'ended_at' => $row->ended_at,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        DB::statement('DROP TABLE _old_seasons');
    }

    private function sqliteRecreateGames(): void
    {
        DB::statement('ALTER TABLE games RENAME TO _old_games');

        DB::statement('CREATE TABLE games (
            id CHAR(36) NOT NULL PRIMARY KEY,
            league_id CHAR(36) NOT NULL,
            season_id CHAR(36),
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (league_id) REFERENCES leagues(id),
            FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE SET NULL
        )');

        $rows = DB::table('_old_games')->get();
        foreach ($rows as $row) {
            DB::table('games')->insert([
                'id' => $this->getUuid('games', $row->id),
                'league_id' => $this->getUuid('leagues', $row->league_id),
                'season_id' => $row->season_id ? $this->getUuid('seasons', $row->season_id) : null,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        DB::statement('DROP TABLE _old_games');
    }

    private function sqliteRecreateTeams(): void
    {
        DB::statement('ALTER TABLE teams RENAME TO _old_teams');

        DB::statement('CREATE TABLE teams (
            id CHAR(36) NOT NULL PRIMARY KEY,
            created_at DATETIME,
            updated_at DATETIME
        )');

        $rows = DB::table('_old_teams')->get();
        foreach ($rows as $row) {
            DB::table('teams')->insert([
                'id' => $this->getUuid('teams', $row->id),
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        DB::statement('DROP TABLE _old_teams');
    }

    private function sqliteRecreateLeagueUser(): void
    {
        DB::statement('ALTER TABLE league_user RENAME TO _old_league_user');

        DB::statement('CREATE TABLE league_user (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            user_id CHAR(36) NOT NULL,
            league_id CHAR(36) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (league_id) REFERENCES leagues(id)
        )');

        $rows = DB::table('_old_league_user')->get();
        foreach ($rows as $row) {
            DB::table('league_user')->insert([
                'user_id' => $this->getUuid('users', $row->user_id),
                'league_id' => $this->getUuid('leagues', $row->league_id),
            ]);
        }

        DB::statement('DROP TABLE _old_league_user');
    }

    private function sqliteRecreateGameTeam(): void
    {
        DB::statement('ALTER TABLE game_team RENAME TO _old_game_team');

        DB::statement('CREATE TABLE game_team (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            game_id CHAR(36) NOT NULL,
            team_id CHAR(36) NOT NULL,
            score INTEGER NOT NULL,
            won INTEGER NOT NULL,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (game_id) REFERENCES games(id),
            FOREIGN KEY (team_id) REFERENCES teams(id)
        )');

        $rows = DB::table('_old_game_team')->get();
        foreach ($rows as $row) {
            DB::table('game_team')->insert([
                'game_id' => $this->getUuid('games', $row->game_id),
                'team_id' => $this->getUuid('teams', $row->team_id),
                'score' => $row->score,
                'won' => $row->won,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        DB::statement('DROP TABLE _old_game_team');
    }

    private function sqliteRecreateTeamUser(): void
    {
        DB::statement('ALTER TABLE team_user RENAME TO _old_team_user');

        DB::statement('CREATE TABLE team_user (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            user_id CHAR(36) NOT NULL,
            team_id CHAR(36) NOT NULL,
            created_at DATETIME,
            updated_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (team_id) REFERENCES teams(id)
        )');

        $rows = DB::table('_old_team_user')->get();
        foreach ($rows as $row) {
            DB::table('team_user')->insert([
                'user_id' => $this->getUuid('users', $row->user_id),
                'team_id' => $this->getUuid('teams', $row->team_id),
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        DB::statement('DROP TABLE _old_team_user');
    }

    private function sqliteRecreateSessions(): void
    {
        DB::statement('ALTER TABLE sessions RENAME TO _old_sessions');

        DB::statement('CREATE TABLE sessions (
            id VARCHAR(255) NOT NULL PRIMARY KEY,
            user_id CHAR(36),
            ip_address VARCHAR(45),
            user_agent TEXT,
            payload LONGTEXT NOT NULL,
            last_activity INTEGER NOT NULL
        )');

        DB::statement('CREATE INDEX sessions_user_id_index ON sessions (user_id)');
        DB::statement('CREATE INDEX sessions_last_activity_index ON sessions (last_activity)');

        $rows = DB::table('_old_sessions')->get();
        foreach ($rows as $row) {
            DB::table('sessions')->insert([
                'id' => $row->id,
                'user_id' => $row->user_id ? $this->getUuid('users', $row->user_id) : null,
                'ip_address' => $row->ip_address,
                'user_agent' => $row->user_agent,
                'payload' => $row->payload,
                'last_activity' => $row->last_activity,
            ]);
        }

        DB::statement('DROP TABLE _old_sessions');
    }

    private function sqliteRecreateMedia(): void
    {
        DB::statement('ALTER TABLE media RENAME TO _old_media');

        DB::statement('CREATE TABLE media (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            model_type VARCHAR(255) NOT NULL,
            model_id CHAR(36) NOT NULL,
            uuid VARCHAR(255) UNIQUE,
            collection_name VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(255),
            disk VARCHAR(255) NOT NULL,
            conversions_disk VARCHAR(255),
            size BIGINT UNSIGNED NOT NULL,
            manipulations TEXT NOT NULL,
            custom_properties TEXT NOT NULL,
            generated_conversions TEXT NOT NULL,
            responsive_images TEXT NOT NULL,
            order_column INTEGER UNSIGNED,
            created_at DATETIME,
            updated_at DATETIME
        )');

        DB::statement('CREATE INDEX media_model_type_model_id_index ON media (model_type, model_id)');
        DB::statement('CREATE INDEX media_order_column_index ON media (order_column)');

        $rows = DB::table('_old_media')->get();
        foreach ($rows as $row) {
            $entity = $this->resolveEntityFromMorphType($row->model_type);
            $newModelId = $entity
                ? ($this->getUuid($entity, $row->model_id) ?? (string) $row->model_id)
                : (string) $row->model_id;

            DB::table('media')->insert([
                'model_type' => $row->model_type,
                'model_id' => $newModelId,
                'uuid' => $row->uuid,
                'collection_name' => $row->collection_name,
                'name' => $row->name,
                'file_name' => $row->file_name,
                'mime_type' => $row->mime_type,
                'disk' => $row->disk,
                'conversions_disk' => $row->conversions_disk,
                'size' => $row->size,
                'manipulations' => $row->manipulations,
                'custom_properties' => $row->custom_properties,
                'generated_conversions' => $row->generated_conversions,
                'responsive_images' => $row->responsive_images,
                'order_column' => $row->order_column,
                'created_at' => $row->created_at,
                'updated_at' => $row->updated_at,
            ]);
        }

        DB::statement('DROP TABLE _old_media');
    }
};
