<?php

namespace App\Http\Controllers;

use App\Models\League;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaderboardController extends Controller
{
    /**
     * Display the leaderboard for a given league, including users with no games,
     * and calculate MMR (Elo rating) for each user, ordered by MMR.
     */
    public function show(Request $request, League $league): JsonResponse
    {
        $seasonParam = $request->query('season');

        if ($seasonParam === 'all') {
            $season = null;
        } elseif ($seasonParam && is_numeric($seasonParam)) {
            $season = $league->seasons()->find((int) $seasonParam) ?? $league->activeSeason;
        } else {
            $season = $league->activeSeason;
        }

        $leaderboard = $league->leaderboard($season);

        return response()->json($leaderboard);
    }
}
