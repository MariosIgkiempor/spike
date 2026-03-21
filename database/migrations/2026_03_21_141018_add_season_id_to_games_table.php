<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->foreignId('season_id')->nullable()->after('league_id');
        });

        // Backfill: create Season 1 for each league and assign existing games
        $leagues = DB::table('leagues')->get();
        foreach ($leagues as $league) {
            $seasonId = DB::table('seasons')->insertGetId([
                'league_id' => $league->id,
                'number' => 1,
                'is_active' => true,
                'started_at' => $league->created_at,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            DB::table('games')
                ->where('league_id', $league->id)
                ->update(['season_id' => $seasonId]);
        }

        Schema::table('games', function (Blueprint $table) {
            $table->foreign('season_id')->references('id')->on('seasons')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('games', function (Blueprint $table) {
            $table->dropForeign(['season_id']);
            $table->dropColumn('season_id');
        });
    }
};
