<?php

declare(strict_types=1);

use App\Models\User;

test('store', function() {
    $this->actingAs(User::factory()->create());

    $response = $this->postJson(route('games.store'), [
        'team1_player1_id' => User::factory()->create()->id,
        'team1_player2_id' => User::factory()->create()->id,
        'team2_player1_id' => User::factory()->create()->id,
        'team2_player2_id' => User::factory()->create()->id,
        'team1_score' => 10,
        'team2_score' => 21,
    ]);

    $this->assertDatabaseCount('games', 1);
    $this->assertDatabaseCount('teams', 2);
});
