<?php

namespace Database\Factories;

use App\Models\League;
use App\Models\Season;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Season>
 */
class SeasonFactory extends Factory
{
    public function definition(): array
    {
        return [
            'league_id' => League::factory(),
            'number' => 1,
            'custom_name' => null,
            'is_active' => true,
            'started_at' => now(),
            'ended_at' => null,
        ];
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
            'ended_at' => now(),
        ]);
    }
}
