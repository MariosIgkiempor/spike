<?php

declare(strict_types=1);

use App\Models\Game;
use App\Models\League;
use App\Models\Season;
use App\Models\Team;
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

function createGameForLeague(League $league, Season $season, array $winnerIds, array $loserIds, int $winnerScore = 21, int $loserScore = 15, ?string $createdAt = null): Game
{
    $game = Game::factory()->create([
        'league_id' => $league->id,
        'season_id' => $season->id,
        'created_at' => $createdAt ?? now(),
    ]);

    $winnerTeam = Team::factory()->create();
    $winnerTeam->players()->attach($winnerIds);

    $loserTeam = Team::factory()->create();
    $loserTeam->players()->attach($loserIds);

    $game->teams()->saveMany([$winnerTeam, $loserTeam], [
        ['score' => $winnerScore, 'won' => true],
        ['score' => $loserScore, 'won' => false],
    ]);

    return $game;
}

test('stats - uses currentWinStreak and currentLoseStreak keys', function () {
    $users = User::factory(3)->create();
    foreach ($users as $user) {
        $this->league->users()->attach($user);
    }

    createGameForLeague($this->league, $this->activeSeason, [$this->user->id, $users[0]->id], [$users[1]->id, $users[2]->id]);

    $response = $this->get(route('web.leagues.show', $this->league).'?season=all');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->has('stats.currentWinStreak')
        ->has('stats.currentLoseStreak')
        ->missing('stats.biggestWinStreak')
        ->missing('stats.biggestLoseStreak')
    );
});

test('stats - last week shows mvp and biggestL even without week-before games', function () {
    $users = User::factory(3)->create();
    foreach ($users as $user) {
        $this->league->users()->attach($user);
    }

    // Create a game last week but none the week before
    $lastWeek = now()->startOfWeek()->subWeek()->addDay();
    createGameForLeague($this->league, $this->activeSeason, [$this->user->id, $users[0]->id], [$users[1]->id, $users[2]->id], 21, 15, $lastWeek->toDateTimeString());

    $response = $this->get(route('web.leagues.show', $this->league).'?season=all');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page
        ->whereNot('stats.lastWeek', null)
        ->whereNot('stats.lastWeek.mvp', null)
        ->whereNot('stats.lastWeek.biggestL', null)
        ->where('stats.lastWeek.mostImproved', null)
    );
});

test('leaderboard includes mmr_history for players with games', function () {
    $users = User::factory(3)->create();
    foreach ($users as $user) {
        $this->league->users()->attach($user);
    }

    createGameForLeague($this->league, $this->activeSeason, [$this->user->id, $users[0]->id], [$users[1]->id, $users[2]->id]);
    createGameForLeague($this->league, $this->activeSeason, [$this->user->id, $users[1]->id], [$users[0]->id, $users[2]->id]);

    $response = $this->get(route('web.leagues.show', $this->league).'?season=all');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) {
        $page->has('leaderboard');
        $leaderboard = $page->toArray()['props']['leaderboard'];
        $playersWithHistory = collect($leaderboard)->filter(fn ($u) => count($u['mmr_history']) > 0);
        expect($playersWithHistory)->not->toBeEmpty();

        // The main user played 2 games so should have 2 history entries
        $mainUser = collect($leaderboard)->firstWhere('id', $this->user->id);
        expect($mainUser['mmr_history'])->toHaveCount(2);
    });
});

test('headToHead returns correct win/loss records', function () {
    $users = User::factory(3)->create();
    foreach ($users as $user) {
        $this->league->users()->attach($user);
    }

    // user + users[0] beat users[1] + users[2] twice
    createGameForLeague($this->league, $this->activeSeason, [$this->user->id, $users[0]->id], [$users[1]->id, $users[2]->id]);
    createGameForLeague($this->league, $this->activeSeason, [$this->user->id, $users[0]->id], [$users[1]->id, $users[2]->id]);
    // users[1] + users[2] beat user + users[0] once
    createGameForLeague($this->league, $this->activeSeason, [$users[1]->id, $users[2]->id], [$this->user->id, $users[0]->id]);

    $response = $this->get(route('web.leagues.show', $this->league).'?season=all');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) use ($users) {
        $h2h = $page->toArray()['props']['headToHead'];

        // user vs users[1]: 2 wins, 1 loss
        expect($h2h[$this->user->id][$users[1]->id]['wins'])->toBe(2);
        expect($h2h[$this->user->id][$users[1]->id]['losses'])->toBe(1);

        // users[1] vs user: 1 win, 2 losses (mirror)
        expect($h2h[$users[1]->id][$this->user->id]['wins'])->toBe(1);
        expect($h2h[$users[1]->id][$this->user->id]['losses'])->toBe(2);
    });
});

test('playerTeammateStats returns correct teammate records', function () {
    $users = User::factory(3)->create();
    foreach ($users as $user) {
        $this->league->users()->attach($user);
    }

    // user paired with users[0]: 2 wins
    createGameForLeague($this->league, $this->activeSeason, [$this->user->id, $users[0]->id], [$users[1]->id, $users[2]->id]);
    createGameForLeague($this->league, $this->activeSeason, [$this->user->id, $users[0]->id], [$users[1]->id, $users[2]->id]);
    // user paired with users[1]: 1 loss
    createGameForLeague($this->league, $this->activeSeason, [$users[0]->id, $users[2]->id], [$this->user->id, $users[1]->id]);

    $response = $this->get(route('web.leagues.show', $this->league).'?season=all');

    $response->assertSuccessful();
    $response->assertInertia(function ($page) use ($users) {
        $stats = $page->toArray()['props']['playerTeammateStats'];

        // user with users[0]: 2 games, 2 wins
        expect($stats[$this->user->id][$users[0]->id]['games'])->toBe(2);
        expect($stats[$this->user->id][$users[0]->id]['wins'])->toBe(2);

        // user with users[1]: 1 game, 0 wins
        expect($stats[$this->user->id][$users[1]->id]['games'])->toBe(1);
        expect($stats[$this->user->id][$users[1]->id]['wins'])->toBe(0);
    });
});
