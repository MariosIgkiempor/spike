<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\Team;
use Illuminate\Support\Facades\Request;

class GameController extends Controller
{
    public function index() {
        $query = Game::with(['teams', 'teams.players']);

        return $query->paginate()->toResourceCollection();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'team1_player1_id' => ['required', 'exists:users,id'],
            'team1_player2_id' => ['required', 'exists:users,id'],
            'team2_player1_id' => ['required', 'exists:users,id'],
            'team2_player2_id' => ['required', 'exists:users,id'],
            'team1_score' => ['required', 'integer', 'min:0', 'max:100'],
            'team2_score' => ['required', 'integer', 'min:0', 'max:100'],
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

        $game = Game::create();
        $team1 = Team::whereHas('players', function ($query) use ($validated) {
            $query->where('users.id', $validated['team1_player1_id']);
        })->whereHas('players', function ($query) use ($validated) {
            $query->where('users.id', $validated['team1_player2_id']);
        })->firstOrCreate();

        $team2 = Team::whereHas('players', function ($query) use ($validated) {
            $query->where('users.id', $validated['team2_player1_id']);
        })->whereHas('players', function ($query) use ($validated) {
            $query->where('users.id', $validated['team2_player2_id']);
        })->firstOrCreate();

        $game->teams()->attach($team1, ['score' => $validated['team1_score'], 'won' => $t1 > $t2]);
        $game->teams()->attach($team2, ['score' => $validated['team2_score'], 'won' => $t2 > $t1]);

        $team1->players->each->increment('games_played');
        $team2->players->each->increment('games_played');
        if ($validated['team1_score'] > $validated['team2_score']) {
            $team1->players->each->increment('games_won');
        } else {
            $team2->players->each->increment('games_won');
        }

        $game->save();

        return redirect()->route('games.index');
    }
}
