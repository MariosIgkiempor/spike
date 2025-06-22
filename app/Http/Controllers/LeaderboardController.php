<?php

namespace App\Http\Controllers;

use App\Models\League;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

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
        // Elo parameters
        $baseRating = 1000;

        // Initialize all users' ratings
        $ratings = [];
        $league->users->each(function ($user) use (&$ratings, $baseRating) {
            $ratings[$user->id] = $baseRating;
        });

        // Process games chronologically to update Elo
        $league->games()
            ->with(['teams.players'])
            ->orderBy('created_at')
            ->get()
            ->each(function ($game) use (&$ratings) {
                $K = 32;
                $teams = $game->teams;
                if ($teams->count() < 2) {
                    return;
                }
                $winner = $teams->firstWhere('pivot.won', true);
                $loser = $teams->firstWhere('pivot.won', false);
                if (!$winner || !$loser) {
                    return;
                }
                // Compute average ratings
                $winnerAvg = $winner->players->avg(fn($u) => $ratings[$u->id]);
                $loserAvg = $loser->players->avg(fn($u) => $ratings[$u->id]);
                $expected = 1 / (1 + pow(10, ($loserAvg - $winnerAvg) / 400));
                $delta = $K * (1 - $expected);

                // Update each player's rating
                foreach ($winner->players as $u) {
                    $ratings[$u->id] += $delta;
                }
                foreach ($loser->players as $u) {
                    $ratings[$u->id] -= $delta;
                }
            });

        $users = $league->users()
            ->select(
                'users.*',
                DB::raw('COUNT(game_team.game_id)                                  as total_games'),
                DB::raw('COALESCE(SUM(CASE WHEN game_team.won = 1 THEN 1 ELSE 0 END),0)   as wins'),
                DB::raw('COALESCE(SUM(CASE WHEN game_team.won = 0 THEN 1 ELSE 0 END),0)   as losses'),
                DB::raw('COALESCE(SUM(game_team.score - opponent.score),0)             as score_diff')
            )
            ->leftJoin('team_user', 'users.id', '=', 'team_user.user_id')
            ->leftJoin('game_team', function ($join) use ($league) {
                $join->on('team_user.team_id', '=', 'game_team.team_id')
                    // only include game_team rows whose game belongs to this league
                    ->whereIn('game_team.game_id', function ($query) use ($league) {
                        $query->select('id')
                            ->from('games')
                            ->where('league_id', $league->id);
                    });
            })
            ->leftJoin('game_team as opponent', function ($j) {
                $j->on('opponent.game_id', '=', 'game_team.game_id')
                    ->whereColumn('opponent.team_id', '!=', 'game_team.team_id');
            })
            ->groupBy([
                'users.id',
                'league_user.league_id',
                'league_user.user_id',
            ])
            ->get();

        // Combine stats, compute win_rate and attach MMR, then sort by MMR
        $leaderboard = $users->map(function ($user) use ($baseRating, $ratings) {
            $total = (int)$user->total_games;
            $wins = (int)$user->wins;
            $user->total_games = $total;
            $user->wins = $wins;
            $user->losses = (int)$user->losses;
            $user->score_diff = (int)$user->score_diff;
            $user->win_rate = $total > 0 ? round($wins / $total, 2) : 0;
            $user->mmr = round($ratings[$user->id] ?? $baseRating);
            return $user;
        })
            ->sortByDesc('mmr')
            ->values()
            ->map(function ($user, $index) {
                $user->rank = $index + 1;
                return $user;
            });

        return response()->json($leaderboard);
    }
}
