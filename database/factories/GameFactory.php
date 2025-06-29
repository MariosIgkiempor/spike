<?php

namespace Database\Factories;

use App\Models\Game;
use App\Models\League;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Game>
 */
class GameFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'league_id' => League::factory(),
            'created_at' => fake()->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
