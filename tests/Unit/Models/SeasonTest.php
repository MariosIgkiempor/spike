<?php

declare(strict_types=1);

use App\Models\Game;
use App\Models\League;
use App\Models\Season;

test('display name returns custom name when set', function () {
    $season = Season::factory()->create(['custom_name' => 'Spring 2026', 'number' => 3]);

    expect($season->displayName())->toBe('Spring 2026');
});

test('display name returns Season N when no custom name', function () {
    $season = Season::factory()->create(['custom_name' => null, 'number' => 2]);

    expect($season->displayName())->toBe('Season 2');
});

test('it belongs to a league', function () {
    $league = League::factory()->create();
    $season = Season::factory()->for($league)->create();

    expect($season->league->id)->toBe($league->id);
});

test('it has many games', function () {
    $season = Season::factory()->create();
    Game::factory(3)->for($season)->for($season->league)->create();

    expect($season->games)->toHaveCount(3);
});
