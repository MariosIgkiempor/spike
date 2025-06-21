<?php

namespace App\Http\Controllers;

use App\Models\League;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class LeaderboardController extends Controller
{
    /**
     * Display the leaderboard for a given league, including users with no games.
     *
     * @param League $league
     * @return JsonResponse
     */
    public function show(League $league): JsonResponse
    {
        // Build an Eloquent query starting from league users
        $users = $league->users()
            ->select(
                'users.*',
                DB::raw('COUNT(game_team.game_id) as total_games'),
                DB::raw('COALESCE(SUM(CASE WHEN game_team.won THEN 1 ELSE 0 END), 0) as wins'),
                DB::raw('COALESCE(SUM(CASE WHEN game_team.won = 0 THEN 1 ELSE 0 END), 0) as losses'),
                DB::raw('COALESCE(ROUND(SUM(CASE WHEN game_team.won THEN 1 ELSE 0 END) / NULLIF(COUNT(game_team.game_id), 0), 2), 0) as win_rate'),
                DB::raw('COALESCE(SUM(game_team.score - opponent.score), 0) as score_diff')
            )
            ->leftJoin('team_user', 'users.id', '=', 'team_user.user_id')
            ->leftJoin('game_team', 'team_user.team_id', '=', 'game_team.team_id')
            // Restrict games to this league via left join condition
            ->leftJoin('games', function ($join) use ($league) {
                $join->on('game_team.game_id', '=', 'games.id')
                    ->where('games.league_id', $league->id);
            })
            // Join opponent scores, still left join to include nulls
            ->leftJoin('game_team as opponent', function ($join) {
                $join->on('opponent.game_id', '=', 'game_team.game_id')
                    ->whereColumn('opponent.team_id', '!=', 'game_team.team_id');
            })
            ->groupBy('users.id')
            // Sort primarily by win rate, then score differential, then total wins
            ->orderByDesc('win_rate')
            ->orderByDesc('score_diff')
            ->orderByDesc('wins')
            ->get();

        // Assign ranks and cast stats types
        $leaderboard = $users->values()->map(function ($user, $index) {
            $user->rank = $index + 1;
            $user->total_games = (int)$user->total_games;
            $user->wins = (int)$user->wins;
            $user->losses = (int)$user->losses;
            $user->score_diff = (int)$user->score_diff;
            // Calculate win rate dynamically to ensure consistency
            $user->win_rate = $user->total_games > 0
                ? round($user->wins / $user->total_games, 2)
                : 0;
            return $user;
        });

        return response()->json($leaderboard);
    }
}
