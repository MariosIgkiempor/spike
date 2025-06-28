<?php

namespace App\Http\Controllers;

use App\Models\League;
use Illuminate\Http\JsonResponse;

class LeaderboardController extends Controller
{
    /**
     * Display the leaderboard for a given league, including users with no games,
     * and calculate MMR (Elo rating) for each user, ordered by MMR.
     *
     * @param League $league
     * @return JsonResponse
     */
    public function show(League $league): JsonResponse
    {

        $leaderboard = $league->leaderboard();

        return response()->json($leaderboard);
    }
}
