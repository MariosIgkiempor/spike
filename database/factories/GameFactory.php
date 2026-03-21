<?php

namespace Database\Factories;

use App\Models\Game;
use App\Models\League;
use App\Models\Season;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Game>
 */
class GameFactory extends Factory
{
    public function definition(): array
    {
        return [
            'league_id' => League::factory(),
            'season_id' => function (array $attributes) {
                return Season::factory()->create(['league_id' => $attributes['league_id']])->id;
            },
            'created_at' => fake()->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
