<?php

declare(strict_types=1);

use App\Models\League;
use App\Models\Season;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->league = League::factory()->create(['user_id' => $this->user->id]);
    $this->league->users()->attach($this->user);

    $this->oldSeason = Season::factory()->for($this->league)->inactive()->create(['number' => 1]);
    $this->activeSeason = Season::factory()->for($this->league)->create(['number' => 2]);

    $this->actingAs($this->user);
});

test('index - defaults to active season when no query param', function () {
    $response = $this->get(route('web.leagues.show', $this->league));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('selectedSeasonId', (string) $this->activeSeason->id)
    );
});

test('index - selects all-time with season=all', function () {
    $response = $this->get(route('web.leagues.show', $this->league).'?season=all');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('selectedSeasonId', 'all')
    );
});

test('index - selects a specific past season', function () {
    $response = $this->get(route('web.leagues.show', $this->league).'?season='.$this->oldSeason->id);

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('selectedSeasonId', (string) $this->oldSeason->id)
    );
});

test('index - falls back to active season for invalid season id', function () {
    $response = $this->get(route('web.leagues.show', $this->league).'?season=99999');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('selectedSeasonId', (string) $this->activeSeason->id)
    );
});

test('index - falls back to active season for season from another league', function () {
    $otherLeague = League::factory()->create();
    $otherSeason = Season::factory()->for($otherLeague)->create(['number' => 1]);

    $response = $this->get(route('web.leagues.show', $this->league).'?season='.$otherSeason->id);

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('selectedSeasonId', (string) $this->activeSeason->id)
    );
});

test('index - defaults to all-time when no active season exists', function () {
    $this->activeSeason->update(['is_active' => false, 'ended_at' => now()]);

    $response = $this->get(route('web.leagues.show', $this->league));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('selectedSeasonId', 'all')
    );
});

test('index - falls back to all-time for invalid season id when no active season', function () {
    $this->activeSeason->update(['is_active' => false, 'ended_at' => now()]);

    $response = $this->get(route('web.leagues.show', $this->league).'?season=99999');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->where('selectedSeasonId', 'all')
    );
});
