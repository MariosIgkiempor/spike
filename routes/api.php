<?php

use App\Http\Controllers\Api\GameVideoController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Video upload routes for games
    Route::post('/games/{game}/video', [GameVideoController::class, 'upload'])->name('api.games.video.upload');
    Route::get('/games/{game}/video', [GameVideoController::class, 'show'])->name('api.games.video.show');
    Route::delete('/games/{game}/video', [GameVideoController::class, 'destroy'])->name('api.games.video.destroy');
});

// Route::apiResource('games', GameController::class);
