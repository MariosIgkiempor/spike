<?php

namespace App\Http\Controllers;

use App\Http\Resources\LeagueResource;
use App\Models\League;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use LaravelIdea\Helper\App\Models\_IH_Game_C;

class WebController extends Controller
{
    public function dashboard(Request $request)
    {
        $leagues = $request->user()->leagues;

        return Inertia::render('dashboard', [
            'leagues' => fn() => LeagueResource::collection($leagues),
            'gamesByMonth' => Inertia::defer(fn() => $request->user()->gamesByMonth(), 'stats'),
            'totalGames' => Inertia::defer(fn() => $request->user()->games()->count(), 'stats'),
            'winRate' => Inertia::defer(fn() => $request->user()->winRate(), 'stats'),
        ]);
    }

    public function league(Request $request, League $league)
    {
        if ($request->user()->leagues->doesntContain($league)) {
            return redirect()->route('dashboard');
        }

        // find the player with the longest winstreak
        $biggestWinStreak = $league->users->map(function ($user) {
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

        $biggestLoseStreak = $league->users->map(function ($user) {
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

        $lastWeekUserStats = $this->collectWeeklyStats($lastWeeksGames);
        $weekBeforeUserStats = $this->collectWeeklyStats($weekBeforeGames);

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
                    return null; // Skip users who didn't play the week before
                }
                $improvement = $stats['played'] > 0 ? ($stats['won'] / $stats['played']) - ($previousStats['won'] / $previousStats['played']) : 0;
                return [
                    'user_id' => $userId,
                    'improvement' => $improvement,
                ];
            })
            ->filter()
            ->sortByDesc('improvement')
            ->first();

        return Inertia::render('league', [
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
                'lastWeek' => [
                    'mvp' => [
                        'user' => User::find($mvp['user_id'])->toResource(),
                        'winRate' => $mvp['win_rate'],
                    ],
                    'biggestL' => [
                        'team' => $biggestL['team']->toResource(),
                        'game' => $biggestL['game']->toResource(),
                        'scoreDifference' => $biggestL['score_difference'],
                    ],
                    'mostImproved' => $mostImproved ? [
                        'user' => User::find($mostImproved['user_id'])->toResource(),
                        'improvement' => $mostImproved['improvement'],
                    ] : null,
                ]
            ],
        ]);
    }

    /**
     * @param Collection|array|_IH_Game_C $lastWeeksGames
     * @return array
     */
    private function collectWeeklyStats(Collection|array|_IH_Game_C $lastWeeksGames): array
    {
        $lastWeekUserStats = [];
        foreach ($lastWeeksGames as $game) {
            foreach ($game->teams as $team) {
                foreach ($team->players as $player) {
                    if (!isset($lastWeekUserStats[$player->id])) {
                        $lastWeekUserStats[$player->id] = [
                            'played' => 0,
                            'won' => 0,
                        ];
                    }
                    $lastWeekUserStats[$player->id]['played']++;
                    if ($team->pivot->won) {
                        $lastWeekUserStats[$player->id]['won']++;
                    }
                }
            }
        }
        return $lastWeekUserStats;
    }

    public function leagueJoin(Request $request, League $league)
    {
        if ($league->users->contains($request->user())) {
            return redirect()->route('web.leagues.show', ['league' => $league]);
        }

        return Inertia::render('league-join', [
            'league' => LeagueResource::make($league)
        ]);
    }
}
