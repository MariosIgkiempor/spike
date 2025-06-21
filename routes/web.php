<?php

use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\LeagueController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebController;
use App\Http\Resources\LeagueResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function (Request $request) {
        $leagues = $request->user()->leagues;

        return Inertia::render('dashboard', [
            'leagues' => LeagueResource::collection($leagues)
        ]);
    })->name('dashboard');

    Route::get('/games', [WebController::class, 'home'])->name('web.games.index');

    Route::get('/leagues/{league}', [WebController::class, 'league'])->name('web.leagues.show');

    Route::get('/api/games/{league?}', [GameController::class, 'index'])->name('api.games.index');
    Route::post('/api/games', [GameController::class, 'store'])->name('api.games.store');

    Route::post('/api/leagues', [LeagueController::class, 'store'])->name('api.leagues.store');

    Route::get('/api/leaderboard/{league}', [LeaderboardController::class, 'show'])->name('api.leaderboard.show');

    Route::get('/api/users/search/{league?}', [UserController::class, 'search'])->name('api.users.search');
});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
