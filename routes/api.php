<?php

use App\Http\Controllers\Api\GameVideoController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->group(function () {
    // Video upload routes for games
    Route::post('/games/{game}/video', [GameVideoController::class, 'upload']);
    Route::get('/games/{game}/video', [GameVideoController::class, 'show']);
    Route::delete('/games/{game}/video', [GameVideoController::class, 'destroy']);
});

//Route::apiResource('games', GameController::class);

