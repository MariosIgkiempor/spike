<?php

declare(strict_types=1);

use App\Models\Game;
use App\Models\Team;

test('to array', function () {
    $game = Game::factory()->create()->fresh();

    expect(array_keys($game->toArray()))->toBe([
        'id',
        'league_id',
        'created_at',
        'updated_at',
    ]);
});

it('has teams', function () {
    $game = Game::factory()->create()->fresh();

    $teams = Team::factory(2)->create();

    $game->teams()->saveMany($teams, [
        ['score' => 20, 'won' => false],
        ['score' => 30, 'won' => true],
    ]);

    expect($game->teams)->toHaveCount(2);
});
