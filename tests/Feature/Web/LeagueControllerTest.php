<?php

declare(strict_types=1);

use App\Models\League;
use App\Models\User;

test('store', function () {
    $user = User::factory()->create();

    $this->actingAs($user);

    $response = $this->postJson(route('api.leagues.store'), [
        'name' => 'Test League',
    ]);

    $response->assertRedirect(route('web.leagues.show', League::where('name', 'Test League')->first()->id));

    $this->assertDatabaseCount('leagues', 1);
    $league = League::first();
    expect($league->users()->count())->toBe(1);
    expect($user->leagues()->count())->toBe(1);
});

test('store - must be authenticated', function () {
    $response = $this->postJson(route('api.leagues.store'));

    $response->assertStatus(401);
});
