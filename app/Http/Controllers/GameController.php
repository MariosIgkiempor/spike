<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GameController extends Controller
{
    public function index(Request $request)
    {
        $query = Game::with(['team1_player1', 'team1_player2', 'team2_player1', 'team2_player2'])
            ->latest();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('team1_player1', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('team1_player2', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('team2_player1', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })
                ->orWhereHas('team2_player2', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                });
            });
        }

        $games = $query->paginate(10);

        // Leaderboard calculation
        $users = User::all();
        $userStats = [];
        foreach ($users as $user) {
            $totalGames = Game::where(function ($q) use ($user) {
                $q->where('team1_player1_id', $user->id)
                    ->orWhere('team1_player2_id', $user->id)
                    ->orWhere('team2_player1_id', $user->id)
                    ->orWhere('team2_player2_id', $user->id);
            })->count();

            $wins = Game::where(function ($q) use ($user) {
                $q->where(function ($q2) use ($user) {
                    $q2->where('team1_player1_id', $user->id)
                        ->orWhere('team1_player2_id', $user->id);
                })->whereColumn('team1_score', '>', 'team2_score')
                ->orWhere(function ($q2) use ($user) {
                    $q2->where('team2_player1_id', $user->id)
                        ->orWhere('team2_player2_id', $user->id);
                })->whereColumn('team2_score', '>', 'team1_score');
            })->count();

            $losses = $totalGames - $wins;

            $scoreDiff = Game::where(function ($q) use ($user) {
                $q->where('team1_player1_id', $user->id)
                    ->orWhere('team1_player2_id', $user->id)
                    ->orWhere('team2_player1_id', $user->id)
                    ->orWhere('team2_player2_id', $user->id);
            })->get()->reduce(function ($carry, $game) use ($user) {
                if ($game->team1_player1_id == $user->id || $game->team1_player2_id == $user->id) {
                    return $carry + ($game->team1_score - $game->team2_score);
                } else {
                    return $carry + ($game->team2_score - $game->team1_score);
                }
            }, 0);

            $userStats[] = [
                'id' => $user->id,
                'name' => $user->name,
                'total_games' => $totalGames,
                'wins' => $wins,
                'losses' => $losses,
                'score_diff' => $scoreDiff,
                'win_rate' => $totalGames > 0 ? round(($wins / $totalGames) * 100, 1) : 0,
            ];
        }

        // Calculate ranks based on win rate
        $leaderboard = collect($userStats)
            ->sortByDesc('win_rate')
            ->values()
            ->map(function ($player, $index) {
                $player['rank'] = $index + 1;
                return $player;
            })
            ->all();

        if ($request->wantsJson()) {
            return response()->json([
                'data' => $games,
                'leaderboard' => $leaderboard,
            ]);
        }

        return Inertia::render('games', [
            'games' => $games,
            'users' => $users,
            'search' => $request->input('search'),
            'leaderboard' => $leaderboard,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'team1_player1_id' => 'required|exists:users,id',
            'team1_player2_id' => 'required|exists:users,id',
            'team2_player1_id' => 'required|exists:users,id',
            'team2_player2_id' => 'required|exists:users,id',
            'team1_score' => 'required|integer|min:0|max:100',
            'team2_score' => 'required|integer|min:0|max:100',
        ]);

        // Custom validation: no draws, winner must win by 2 and have at least 21
        $t1 = $validated['team1_score'];
        $t2 = $validated['team2_score'];
        if ($t1 === $t2) {
            return back()->withErrors(['team1_score' => 'There cannot be a draw.', 'team2_score' => 'There cannot be a draw.'])->withInput();
        }
        if ($t1 < 21 && $t2 < 21) {
            return back()->withErrors(['team1_score' => 'The winner must have at least 21 points.', 'team2_score' => 'The winner must have at least 21 points.'])->withInput();
        }
        if ($t1 > $t2) {
            if ($t1 - $t2 < 2) {
                return back()->withErrors(['team1_score' => 'The winner must win by at least 2 points.', 'team2_score' => 'The winner must win by at least 2 points.'])->withInput();
            }
        } else {
            if ($t2 - $t1 < 2) {
                return back()->withErrors(['team1_score' => 'The winner must win by at least 2 points.', 'team2_score' => 'The winner must win by at least 2 points.'])->withInput();
            }
        }

        Game::create($validated);

        return redirect()->route('games.index');
    }
} 