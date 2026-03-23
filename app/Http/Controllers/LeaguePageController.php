<?php

namespace App\Http\Controllers;

use App\Http\Resources\SeasonResource;
use App\Models\League;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaguePageController extends Controller
{
    public function index(Request $request, League $league)
    {
        if ($request->user()->leagues->doesntContain($league)) {
            return redirect()->route('dashboard');
        }

        $activeSeason = $league->activeSeason;
        $seasonParam = $request->query('season');

        if ($seasonParam === 'all') {
            $statsSeason = null;
            $selectedSeasonId = 'all';
        } elseif ($seasonParam) {
            $statsSeason = $league->seasons()->find($seasonParam) ?? $activeSeason;
            $selectedSeasonId = $statsSeason ? (string) $statsSeason->id : 'all';
        } else {
            $statsSeason = $activeSeason;
            $selectedSeasonId = $activeSeason ? (string) $activeSeason->id : 'all';
        }

        $league->setRelation('games', $league->scopedGames($statsSeason)->orderByDesc('created_at')->get());

        // find the player with the longest win streak
        $biggestWinStreak = $league->users
            ->map(function ($user) use ($league, $statsSeason) {
                return [
                    'user' => $user,
                    'winStreak' => $league->scopedGames($statsSeason)
                        ->whereHas('teams.players', function ($query) use ($user) {
                            $query->where('users.id', $user->id);
                        })
                        ->orderByDesc('created_at')
                        ->get()
                        ->takeWhile(function ($game) use ($user) {
                            return $game->teams->contains(function ($team) use ($user) {
                                return $team->players->contains($user) && $team->pivot->won;
                            });
                        })->count(),
                ];
            })
            ->sortByDesc('winStreak')
            ->sortByDesc('games_count')
            ->first();

        $biggestLoseStreak = $league->users
            ->map(function ($user) use ($league, $statsSeason) {
                return [
                    'user' => $user,
                    'loseStreak' => $league->scopedGames($statsSeason)
                        ->whereHas('teams.players', function ($query) use ($user) {
                            $query->where('users.id', $user->id);
                        })
                        ->orderByDesc('created_at')
                        ->get()
                        ->takeWhile(function ($game) use ($user) {
                            return $game->teams->contains(function ($team) use ($user) {
                                return $team->players->contains($user) && ! $team->pivot->won;
                            });
                        })->count(),
                ];
            })
            ->sortByDesc('loseStreak')
            ->sortByDesc('games_count')
            ->first();

        $startOfWeek = now()->startOfWeek();
        $startOfLastWeek = now()->startOfWeek()->subWeek();
        $startOfWeekBefore = now()->startOfWeek()->subWeeks(2);
        $lastWeeksGames = $league->scopedGames($statsSeason)->whereBetween('created_at', [$startOfLastWeek, $startOfWeek])->get();
        $weekBeforeGames = $league->scopedGames($statsSeason)->whereBetween('created_at', [$startOfWeekBefore, $startOfLastWeek])->get();

        $lastWeekUserStats = $league->collectStats($lastWeeksGames);
        $weekBeforeUserStats = $league->collectStats($weekBeforeGames);

        // mvp has the best win/played ratio
        $mvp = collect($lastWeekUserStats)
            ->map(function ($stats, $userId) {
                return [
                    'user_id' => $userId,
                    'win_rate' => $stats['played'] > 0 ? $stats['won'] / $stats['played'] : 0,
                ];
            })
            ->sortByDesc('win_rate')
            ->first();

        // biggestL is the team who, in the last week, lost the game with the highest score difference
        $biggestL = $lastWeeksGames->map(function ($game) {
            $min = $game->teams
                ->map(function ($team) {
                    return [
                        'team' => $team,
                        'score' => $team->pivot->score,
                    ];
                })
                ->sortBy('score')
                ->first();

            $max = $game->teams
                ->map(function ($team) {
                    return [
                        'team' => $team,
                        'score' => $team->pivot->score,
                    ];
                })
                ->sortByDesc('score')
                ->first();

            return [
                'game' => $game,
                'team' => $min['team'],
                'score_difference' => abs($max['score'] - $min['score']),
            ];
        })->sortByDesc('score_difference')->first();

        // most_improved is the player who had the highest win rate improvement from the week before
        // if they didn't play the week before, they are not considered
        $mostImproved = collect($lastWeekUserStats)
            ->map(function ($stats, $userId) use ($weekBeforeUserStats) {
                $previousStats = $weekBeforeUserStats[$userId] ?? null;
                if (! $previousStats || $previousStats['played'] === 0) {
                    return [
                        'user_id' => $userId,
                        'improvement' => 0,
                    ];
                }
                $improvement = $stats['played'] > 0 ? ($stats['won'] / $stats['played']) - ($previousStats['won'] / $previousStats['played']) : 0;

                return [
                    'user_id' => $userId,
                    'improvement' => $improvement,
                ];
            })
            ->filter(function ($stats) {
                return $stats['improvement'] > 0;
            })
            ->sortByDesc('improvement')
            ->first();

        return Inertia::render('league', [
            'can' => [
                'deleteGames' => $request->user()?->can('deleteGames', $league),
                'startSeason' => $request->user()?->can('startSeason', $league),
            ],
            'league' => fn () => $league->toResource(),
            'currentSeason' => fn () => $activeSeason ? SeasonResource::make($activeSeason) : null,
            'selectedSeasonId' => $selectedSeasonId,
            'leaderboard' => fn () => $league->leaderboard($statsSeason),
            'teamStats' => fn () => $league->teamStats($statsSeason),
            'headToHead' => fn () => $league->headToHead($statsSeason),
            'playerTeammateStats' => fn () => $league->playerTeammateStats($statsSeason),
            'stats' => fn () => [
                'currentWinStreak' => $biggestWinStreak ? [
                    ...$biggestWinStreak,
                    'user' => $biggestWinStreak['user']->toResource(),
                ] : null,
                'currentLoseStreak' => $biggestLoseStreak ? [
                    ...$biggestLoseStreak,
                    'user' => $biggestLoseStreak['user']->toResource(),
                ] : null,
                'lastWeek' => $lastWeeksGames->count() > 0
                    ? [
                        'mvp' => $mvp ? [
                            'user' => User::find($mvp['user_id'])->toResource(),
                            'winRate' => $mvp['win_rate'],
                        ] : null,
                        'biggestL' => $biggestL ? [
                            'team' => $biggestL['team']->toResource(),
                            'game' => $biggestL['game']->toResource(),
                            'scoreDifference' => $biggestL['score_difference'],
                        ] : null,
                        'mostImproved' => ($weekBeforeGames->count() > 0 && $mostImproved) ? [
                            'user' => User::find($mostImproved['user_id'])->toResource(),
                            'improvement' => $mostImproved['improvement'],
                        ] : null,
                    ]
                    : null,
            ],
        ]);
    }
}
