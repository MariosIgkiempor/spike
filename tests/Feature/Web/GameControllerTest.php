<?php

declare(strict_types=1);

use App\Models\League;
use App\Models\User;

test('store', function () {
    $user = User::factory()->create();
    $league = League::factory()->create(['user_id' => $user->id]);
    $user->leagues()->attach($league);

    $this->actingAs($user);

    $response = $this->postJson(route('api.games.store'), [
        'league_id' => $league->id,
        'team1' => [User::factory()->create()->id, User::factory()->create()->id],
        'team2' => [User::factory()->create()->id, User::factory()->create()->id],
        'team1_score' => 10,
        'team2_score' => 21,
        'date' => now()->subHour(),
    ]);

    $response->assertOk();

    $this->assertDatabaseCount('games', 1);
    $this->assertDatabaseCount('teams', 2);
});

test('store - must be authenticated', function () {
    $response = $this->postJson(route('api.games.store'));

    $response->assertStatus(401);
});

test('store - must belong to the league', function () {
    $user = User::factory()->create();
    $league = League::factory()->create(['user_id' => $user->id]);
    $user->leagues()->attach($league);

    $otherLeague = League::factory()->create();

    $this->actingAs($user);

    $response = $this->postJson(route('api.games.store'), [
        'league_id' => $otherLeague->id,
        'team1_player1_id' => User::factory()->create()->id,
        'team1_player2_id' => User::factory()->create()->id,
        'team2_player1_id' => User::factory()->create()->id,
        'team2_player2_id' => User::factory()->create()->id,
        'team1_score' => 10,
        'team2_score' => 21,
    ]);

    $response->assertStatus(403);
});
