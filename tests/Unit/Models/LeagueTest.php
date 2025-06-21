<?php

declare(strict_types=1);

use App\Models\League;

test('to array', function () {
    $league = League::factory()->create()->fresh();

    expect(array_keys($league->toArray()))->not->toBe([
        'id',
        'name',
        'created_at',
        'updated_at',
    ]);
});
