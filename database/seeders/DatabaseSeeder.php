<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\League;
use App\Models\Player;
use App\Models\Team;
use App\Models\User;
use Illuminate\Database\Seeder;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $me = User::factory()->create([
            'name' => 'Alice',
            'email' => 'alice@example.com',
        ]);

        $you = User::factory()->create([
            'name' => 'Bob',
            'email' => 'bob@example.com'
        ]);

        $leagues = League::factory(10)->for($me)->create();
        $leagues->each(function ($league) {
            $league->users()->attach($league->user_id);
        });
        $me->leagues()->sync($leagues->pluck('id'));

        $leagues->each(function ($league) {
            $users = User::factory(10)->create();
            $league->users()->attach($users->pluck('id'));

            $games = Game::factory(10)->for($league)->create();

            $games->each(function ($game) use ($users) {
                $teamCount = 2;
                for ($i = 0; $i < $teamCount; $i++) {
                    $playersPerTeam = 2;
                    $players = $users->random($playersPerTeam);
                    $playerIds = $players->pluck('id');

                    // Try to find an existing team with exactly these players
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

                // Assign a random team as a winner
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
        });
    }
}
