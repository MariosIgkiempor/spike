<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Player;
use App\Models\Game;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        for ($i = 1; $i <= 20; $i++) {
            User::create([
                'name' => 'User ' . $i,
                'email' => 'user' . $i . '@example.com',
                'password' => bcrypt('password'),
            ]);
        }

        // Create some players
        $players = [
            Player::create(['name' => 'John Doe', 'email' => 'john@example.com']),
            Player::create(['name' => 'Jane Smith', 'email' => 'jane@example.com']),
            Player::create(['name' => 'Mike Johnson', 'email' => 'mike@example.com']),
            Player::create(['name' => 'Sarah Williams', 'email' => 'sarah@example.com']),
        ];

        // Create games using the created users
        Game::create([
            'team1_player1_id' => 1,
            'team1_player2_id' => 2,
            'team2_player1_id' => 3,
            'team2_player2_id' => 4,
            'team1_score' => 21,
            'team2_score' => 15,
        ]);

        Game::create([
            'team1_player1_id' => 5,
            'team1_player2_id' => 6,
            'team2_player1_id' => 7,
            'team2_player2_id' => 8,
            'team1_score' => 21,
            'team2_score' => 19,
        ]);
    }
}
