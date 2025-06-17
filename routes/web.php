<?php

use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WebController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
    Route::get('/games', [WebController::class, 'home'])->name('web.games.index');
    Route::get('/api/games', [GameController::class, 'index'])->name('api.games.index');
    Route::post('/api/games', [GameController::class, 'store'])->name('api.games.store');

    Route::get('/api/users/search', [UserController::class, 'search'])->name('api.users.search');
});


require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
