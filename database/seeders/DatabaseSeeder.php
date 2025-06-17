<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\Player;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        $users = User::factory(10)->create();

        $games = Game::factory(10)->create();

        $teamCount = 2;

        $games->each(function ($game) use ($teamCount) {
            for ($i = 0; $i < $teamCount; $i++) {
                $playersPerTeam = 2;
                $players = User::inRandomOrder()->take($playersPerTeam)->get();
                $playerIds = $players->pluck('id');

                // Try to find existing team with exactly these players
                $team = Team::whereHas('players', function ($query) use ($playerIds) {
                    $query->whereIn('users.id', $playerIds);
                }, '=', $playerIds->count())
                    ->whereDoesntHave('players', function ($query) use ($playerIds) {
                        $query->whereNotIn('users.id', $playerIds);
                    })
                    ->first();

                // If no such team exists, create one and attach players
                if (!$team) {
                    $team = Team::create(); // Or factory(1)->create()->first()
                    $team->players()->attach($playerIds);
                }

                // Attach team to game
                $game->teams()->attach($team->id, ['score' => 0, 'won' => false]);
            }

            // Assign a random team as winner
            $winningTeam = $game->teams()->inRandomOrder()->first();
            $game->teams()->updateExistingPivot($winningTeam->id, ['score' => 100, 'won' => true]);

            // Update stats
            $game->teams->each(function ($team) use ($winningTeam) {
                $team->players->each(function ($player) use ($team, $winningTeam) {
                    $player->increment('games_played');
                    if ($team->id === $winningTeam->id) {
                        $player->increment('games_won');
                    }
                });
            });
        });
    }
}
