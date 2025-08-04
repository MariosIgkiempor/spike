<?php

declare(strict_types=1);

use App\Models\Team;
use App\Models\User;

test('to array', function () {
    $team = Team::factory()->create()->fresh();

    expect(array_keys($team->toArray()))->toBe([
        'id',
        'created_at',
        'updated_at',
    ]);
});

it('has users', function () {
    $team = Team::factory()->create()->fresh();

    $users = User::factory(2)->create();

    $team->players()->saveMany($users);

    expect($team->players)->toHaveCount(2);
});
