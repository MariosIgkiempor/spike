<?php

declare(strict_types=1);

use App\Models\League;
use App\Models\Season;
use App\Models\User;

test('store - creates a new season as league owner', function () {
    $user = User::factory()->create();
    $league = League::factory()->create(['user_id' => $user->id]);
    Season::factory()->for($league)->create(['number' => 1]);

    $this->actingAs($user);

    $response = $this->post(route('api.seasons.store', $league));

    $response->assertRedirect();
    $this->assertDatabaseCount('seasons', 2);

    $newSeason = $league->seasons()->where('number', 2)->first();
    expect($newSeason)->not->toBeNull();
    expect($newSeason->is_active)->toBeTrue();
});

test('store - closes previous active season', function () {
    $user = User::factory()->create();
    $league = League::factory()->create(['user_id' => $user->id]);
    $oldSeason = Season::factory()->for($league)->create(['number' => 1]);

    $this->actingAs($user);

    $this->post(route('api.seasons.store', $league));

    $oldSeason->refresh();
    expect($oldSeason->is_active)->toBeFalse();
    expect($oldSeason->ended_at)->not->toBeNull();
});

test('store - sets correct season number sequentially', function () {
    $user = User::factory()->create();
    $league = League::factory()->create(['user_id' => $user->id]);
    Season::factory()->for($league)->inactive()->create(['number' => 1]);
    Season::factory()->for($league)->create(['number' => 2]);

    $this->actingAs($user);

    $this->post(route('api.seasons.store', $league));

    $newSeason = $league->seasons()->where('number', 3)->first();
    expect($newSeason)->not->toBeNull();
    expect($newSeason->is_active)->toBeTrue();
});

test('store - saves custom name when provided', function () {
    $user = User::factory()->create();
    $league = League::factory()->create(['user_id' => $user->id]);
    Season::factory()->for($league)->create(['number' => 1]);

    $this->actingAs($user);

    $this->post(route('api.seasons.store', $league), [
        'custom_name' => 'Spring 2026',
    ]);

    $newSeason = $league->seasons()->where('number', 2)->first();
    expect($newSeason->custom_name)->toBe('Spring 2026');
});

test('store - returns 403 when non-owner attempts to start season', function () {
    $owner = User::factory()->create();
    $league = League::factory()->create(['user_id' => $owner->id]);
    Season::factory()->for($league)->create(['number' => 1]);

    $otherUser = User::factory()->create();
    $league->users()->attach($otherUser);

    $this->actingAs($otherUser);

    $response = $this->post(route('api.seasons.store', $league));

    $response->assertForbidden();
});

test('store - returns 401 when unauthenticated', function () {
    $league = League::factory()->create();

    $response = $this->postJson(route('api.seasons.store', $league));

    $response->assertUnauthorized();
});
