<?php

use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\LeaderboardController;
use App\Http\Controllers\LeagueController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [WebController::class, 'dashboard'])->name('dashboard');
    Route::get('/leagues/{league}', [WebController::class, 'league'])->name('web.leagues.show');
    Route::get('/leagues/{league}/join', [WebController::class, 'leagueJoin'])->name('web.leagues.join');

    Route::get('/api/games/{league?}', [GameController::class, 'index'])->name('api.games.index');
    Route::post('/api/games', [GameController::class, 'store'])->name('api.games.store');

    Route::post('/api/leagues', [LeagueController::class, 'store'])->name('api.leagues.store');
    Route::post('/api/leagues/join/{league}', [LeagueController::class, 'join'])->name('api.leagues.join');

    Route::get('/api/leaderboard/{league}', [LeaderboardController::class, 'show'])->name('api.leaderboard.show');

    Route::get('/api/users/search/{league?}', [UserController::class, 'search'])->name('api.users.search');
});

Route::get('/', function (Request $request) {
    if ($request->user()) {
        return redirect()->route('dashboard');
    }
    return Inertia::render('welcome');
})->name('home');


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
