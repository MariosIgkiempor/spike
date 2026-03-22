<?php

namespace App\Models;

use Database\Factories\LeagueFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use LaravelIdea\Helper\App\Models\_IH_Game_C;

class League extends Model
{
    /** @use HasFactory<LeagueFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if a player has played any games in this league
     */
    private function hasPlayedGames($userId, ?Season $season = null): bool
    {
        return $this->scopedGames($season)
            ->whereHas('teams.players', function ($query) use ($userId) {
                $query->where('users.id', $userId);
            })
            ->exists();
    }

    /**
     * Calculate dynamic K-factor based on rating difference and experience
     */
    private function getKFactor($winnerAvg, $loserAvg, $totalGames): int
    {
        $baseK = 32;
        $ratingDiff = abs($winnerAvg - $loserAvg);

        // Reduce K-factor for experienced players
        if ($totalGames > 50) {
            $baseK = 16;
        } elseif ($totalGames > 20) {
            $baseK = 24;
        }

        // Increase K-factor for large rating differences
        if ($ratingDiff > 200) {
            $baseK = min($baseK + 8, 40);
        }

        return $baseK;
    }

    /**
     * Calculate streak multiplier for both win and lose streaks
     */
    private function getStreakMultiplier($streak): float
    {
        $absStreak = abs($streak);

        if ($absStreak < 2) {
            return 1.0;
        }
        if ($absStreak >= 5) {
            return 1.4;
        }

        // Linear scaling: 2 streak = 1.1x, 3 streak = 1.2x, 4 streak = 1.3x, 5+ streak = 1.4x
        // Works for both positive (win) and negative (lose) streaks
        return 1.0 + ($absStreak - 1) * 0.1;
    }

    public function leaderboard(?Season $season = null)
    {
        // Elo parameters
        $baseRating = 1000;

        // Initialize all users' ratings - new players start at 0
        $ratings = [];
        $this->users->each(function ($user) use (&$ratings, $baseRating, $season) {
            $ratings[$user->id] = $this->hasPlayedGames($user->id, $season) ? $baseRating : 0;
        });

        // Process games chronologically to update Elo
        $gameCount = 0;
        $streaks = []; // Track win/loss streaks for each player
        $mmrHistory = []; // Track MMR progression per player
        $this->scopedGames($season)
            ->with(['teams.players'])
            ->orderBy('created_at')
            ->get()
            ->each(function ($game) use (&$ratings, &$gameCount, &$streaks, &$mmrHistory) {
                $gameCount++;
                $teams = $game->teams;
                if ($teams->count() < 2) {
                    return;
                }
                $winner = $teams->firstWhere('pivot.won', true);
                $loser = $teams->firstWhere('pivot.won', false);
                if (! $winner || ! $loser) {
                    return;
                }

                // Compute average ratings (treat 0 MMR players as base rating for calculations)
                $winnerAvg = $winner->players->avg(fn ($u) => $ratings[$u->id] ?: 1000);
                $loserAvg = $loser->players->avg(fn ($u) => $ratings[$u->id] ?: 1000);

                // Calculate expected outcome
                $expected = 1 / (1 + pow(10, ($loserAvg - $winnerAvg) / 400));

                // Get dynamic K-factor
                $K = $this->getKFactor($winnerAvg, $loserAvg, $gameCount);

                // Calculate score difference multiplier (0.5 to 1.0)
                $winnerScore = $winner->pivot->score;
                $loserScore = $loser->pivot->score;
                $scoreDiff = abs($winnerScore - $loserScore);
                $maxScore = max($winnerScore, $loserScore);
                $scoreMultiplier = $maxScore > 0 ? 0.5 + ($scoreDiff / $maxScore) * 0.5 : 1.0;

                // Calculate upset bonus (extra points for beating higher-rated opponents)
                $ratingDiff = $loserAvg - $winnerAvg;
                $upsetBonus = $ratingDiff > 0 ? 1 + ($ratingDiff / 400) * 0.3 : 1;

                // Calculate base delta
                $baseDelta = $K * (1 - $expected) * $scoreMultiplier * $upsetBonus;

                // Update each player's rating with streak bonuses
                foreach ($winner->players as $u) {
                    if ($ratings[$u->id] === 0) {
                        $ratings[$u->id] = 1000; // Initialize new players at base rating
                    }

                    // Initialize streak if not exists
                    if (! isset($streaks[$u->id])) {
                        $streaks[$u->id] = 0;
                    }

                    // Update win streak (reset if coming from loss streak, increment if continuing win streak)
                    $streaks[$u->id] = $streaks[$u->id] <= 0 ? 1 : $streaks[$u->id] + 1;

                    // Apply streak multiplier to MMR gain
                    $streakMultiplier = $this->getStreakMultiplier($streaks[$u->id]);
                    $finalDelta = $baseDelta * $streakMultiplier;

                    $ratings[$u->id] += $finalDelta;
                    $mmrHistory[$u->id][] = ['game' => $gameCount, 'mmr' => round($ratings[$u->id])];
                }

                foreach ($loser->players as $u) {
                    if ($ratings[$u->id] === 0) {
                        $ratings[$u->id] = 1000; // Initialize new players at base rating
                    }

                    // Initialize streak if not exists
                    if (! isset($streaks[$u->id])) {
                        $streaks[$u->id] = 0;
                    }

                    // Update loss streak (reset if coming from win streak, decrement if continuing loss streak)
                    $streaks[$u->id] = $streaks[$u->id] >= 0 ? -1 : $streaks[$u->id] - 1;

                    // Apply streak multiplier to MMR loss (lose streaks amplify losses)
                    $streakMultiplier = $this->getStreakMultiplier($streaks[$u->id]);
                    $finalDelta = $baseDelta * $streakMultiplier;

                    $ratings[$u->id] -= $finalDelta;
                    $mmrHistory[$u->id][] = ['game' => $gameCount, 'mmr' => round($ratings[$u->id])];
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
            ->leftJoin('game_team', function ($join) use ($season) {
                $join->on('team_user.team_id', '=', 'game_team.team_id')
                    // only include game_team rows whose game belongs to this league
                    ->whereIn('game_team.game_id', function ($query) use ($season) {
                        $query->select('id')
                            ->from('games')
                            ->where('league_id', $this->id)
                            ->when($season, fn ($q) => $q->where('season_id', $season->id));
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
        $leaderboard = $users->map(function ($user) use ($ratings, $mmrHistory) {
            $total = (int) $user->total_games;
            $wins = (int) $user->wins;
            $user->total_games = $total;
            $user->wins = $wins;
            $user->losses = (int) $user->losses;
            $user->score_diff = (int) $user->score_diff;
            $user->win_rate = $total > 0 ? round($wins / $total, 2) : 0;
            // Players who haven't played get 0 MMR, others get their calculated rating
            $user->mmr = round($ratings[$user->id] ?? 0);
            $user->mmr_history = $mmrHistory[$user->id] ?? [];

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

    public function seasons(): HasMany
    {
        return $this->hasMany(Season::class);
    }

    public function activeSeason(): HasOne
    {
        return $this->hasOne(Season::class)->where('is_active', true);
    }

    public function scopedGames(?Season $season = null): HasMany
    {
        return $this->games()->when($season, fn ($query) => $query->where('season_id', $season->id));
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class);
    }

    public function teamStats(?Season $season = null): Collection
    {
        $stats = [];

        // Eager-load teams and their players for scoped games
        $games = $this->scopedGames($season)
            ->with('teams.players')
            ->get();

        foreach ($games as $game) {
            foreach ($game->teams as $team) {
                $teamId = $team->id;

                if (! isset($stats[$teamId])) {
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

    /**
     * Get head-to-head win/loss records between all players.
     *
     * @return array<int, array<int, array{wins: int, losses: int}>>
     */
    public function headToHead(?Season $season = null): array
    {
        $h2h = [];
        $games = $this->scopedGames($season)
            ->with('teams.players')
            ->get();

        foreach ($games as $game) {
            $teams = $game->teams;
            if ($teams->count() < 2) {
                continue;
            }

            $winner = $teams->firstWhere('pivot.won', true);
            $loser = $teams->firstWhere('pivot.won', false);
            if (! $winner || ! $loser) {
                continue;
            }

            foreach ($winner->players as $wp) {
                foreach ($loser->players as $lp) {
                    $h2h[$wp->id][$lp->id]['wins'] = ($h2h[$wp->id][$lp->id]['wins'] ?? 0) + 1;
                    $h2h[$wp->id][$lp->id]['losses'] = $h2h[$wp->id][$lp->id]['losses'] ?? 0;

                    $h2h[$lp->id][$wp->id]['losses'] = ($h2h[$lp->id][$wp->id]['losses'] ?? 0) + 1;
                    $h2h[$lp->id][$wp->id]['wins'] = $h2h[$lp->id][$wp->id]['wins'] ?? 0;
                }
            }
        }

        return $h2h;
    }

    /**
     * Get win rates for each player paired with each teammate.
     *
     * @return array<int, array<int, array{games: int, wins: int}>>
     */
    public function playerTeammateStats(?Season $season = null): array
    {
        $stats = [];
        $games = $this->scopedGames($season)
            ->with('teams.players')
            ->get();

        foreach ($games as $game) {
            foreach ($game->teams as $team) {
                $players = $team->players;
                $won = $team->pivot->won;

                foreach ($players as $p1) {
                    foreach ($players as $p2) {
                        if ($p1->id === $p2->id) {
                            continue;
                        }

                        if (! isset($stats[$p1->id][$p2->id])) {
                            $stats[$p1->id][$p2->id] = ['games' => 0, 'wins' => 0];
                        }
                        $stats[$p1->id][$p2->id]['games']++;
                        if ($won) {
                            $stats[$p1->id][$p2->id]['wins']++;
                        }
                    }
                }
            }
        }

        return $stats;
    }

    /**
     * @param  \Illuminate\Database\Eloquent\Collection|array|_IH_Game_C  $lastWeeksGames
     */
    public function collectStats(Collection|array|_IH_Game_C $lastWeeksGames): array
    {
        $stats = [];
        foreach ($lastWeeksGames as $game) {
            foreach ($game->teams as $team) {
                foreach ($team->players as $player) {
                    if (! isset($stats[$player->id])) {
                        $stats[$player->id] = [
                            'played' => 0,
                            'won' => 0,
                        ];
                    }
                    $stats[$player->id]['played']++;
                    if ($team->pivot->won) {
                        $stats[$player->id]['won']++;
                    }
                }
            }
        }

        return $stats;
    }
}
