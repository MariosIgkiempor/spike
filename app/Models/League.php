<?php

namespace App\Models;

use Database\Factories\LeagueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class League extends Model
{
    /** @use HasFactory<LeagueFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function leaderboard()
    {
        // Elo parameters
        $baseRating = 1000;

        // Initialize all users' ratings
        $ratings = [];
        $this->users->each(function ($user) use (&$ratings, $baseRating) {
            $ratings[$user->id] = $baseRating;
        });

        // Process games chronologically to update Elo
        $this->games()
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

        $users = $this->users()
            ->select(
                'users.*',
                DB::raw('COUNT(game_team.game_id)                                  as total_games'),
                DB::raw('COALESCE(SUM(CASE WHEN game_team.won = 1 THEN 1 ELSE 0 END),0)   as wins'),
                DB::raw('COALESCE(SUM(CASE WHEN game_team.won = 0 THEN 1 ELSE 0 END),0)   as losses'),
                DB::raw('COALESCE(SUM(game_team.score - opponent.score),0)             as score_diff')
            )
            ->leftJoin('team_user', 'users.id', '=', 'team_user.user_id')
            ->leftJoin('game_team', function ($join) {
                $join->on('team_user.team_id', '=', 'game_team.team_id')
                    // only include game_team rows whose game belongs to this league
                    ->whereIn('game_team.game_id', function ($query) {
                        $query->select('id')
                            ->from('games')
                            ->where('league_id', $this->id);
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

        return $leaderboard;
    }

    public function games(): HasMany
    {
        return $this->hasMany(Game::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function teamStats(): Collection
    {
        $stats = [];

        // Eager-load teams and their players for all games in this league
        $games = $this->games()
            ->with('teams.players')
            ->get();

        foreach ($games as $game) {
            foreach ($game->teams as $team) {
                $teamId = $team->id;

                if (!isset($stats[$teamId])) {
                    $stats[$teamId] = [
                        'team' => $team,
                        'players' => $team->players,
                        'played' => 0,
                        'won' => 0,
                    ];
                }

                // Increment games played for this team
                $stats[$teamId]['played']++;

                // Increment wins if this team won in this game
                if ($team->pivot->won) {
                    $stats[$teamId]['won']++;
                }
            }
        }

        return collect($stats)
            ->sort(function ($a, $b) {
                if ($a['won'] !== $b['won']) {
                    return $b['won'] <=> $a['won']; // Most wins first
                }
                return $a['played'] <=> $b['played']; // Least games played first
            })
            ->values();
    }
}
