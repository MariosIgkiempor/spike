<?php

namespace App\Http\Controllers;

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

        // find the player with the longest win streak
        $biggestWinStreak = $league->users
            ->map(function ($user) {
                return [
                    'user' => $user,
                    'winStreak' => $user->games()
                        ->sortByDesc('created_at')
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
            ->map(function ($user) {
                return [
                    'user' => $user,
                    'loseStreak' => $user->games()
                        ->sortByDesc('created_at')
                        ->takeWhile(function ($game) use ($user) {
                            return $game->teams->contains(function ($team) use ($user) {
                                return $team->players->contains($user) && !$team->pivot->won;
                            });
                        })->count(),
                ];
            })
            ->sortByDesc('loseStreak')
            ->sortByDesc('games_count')
            ->first();


        $startOfWeek = now()->startOfWeek();
        $startOfLastWeek = $startOfWeek->subWeek();
        $lastWeeksGames = $league->games()->whereBetween('created_at', [$startOfLastWeek, $startOfWeek])->get();
        $weekBeforeGames = $league->games()->whereBetween('created_at', [$startOfLastWeek->subWeek(), $startOfLastWeek])->get();

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
        $biggestL = $lastWeeksGames->map(function ($game) use ($weekBeforeGames) {
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
                if (!$previousStats || $previousStats['played'] === 0) {
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
            ],
            'league' => fn() => $league->toResource(),
            'leaderboard' => fn() => $league->leaderboard(),
            'teamStats' => fn() => $league->teamStats(),
            'stats' => fn() => [
                'biggestWinStreak' => [
                    ...$biggestWinStreak,
                    'user' => $biggestWinStreak['user']->toResource(),
                ],
                'biggestLoseStreak' => [
                    ...$biggestLoseStreak,
                    'user' => $biggestLoseStreak['user']->toResource(),
                ],
                'lastWeek' => $lastWeeksGames->count() > 0 && $weekBeforeGames->count() > 0
                    ? [
                        'mvp' => [
                            'user' => User::find($mvp['user_id'])->toResource(),
                            'winRate' => $mvp['win_rate'],
                        ],
                        'biggestL' => [
                            'team' => $biggestL['team']->toResource(),
                            'game' => $biggestL['game']->toResource(),
                            'scoreDifference' => $biggestL['score_difference'],
                        ],
                        'mostImproved' => [
                            'user' => User::find($mostImproved['user_id'])->toResource(),
                            'improvement' => $mostImproved['improvement'],
                        ],
                    ]
                    : null,
            ],
        ]);
    }
}
