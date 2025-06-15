<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Game;

class GameController extends Controller
{
    public function index()
    {
        return Game::with(['team1', 'team2'])->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'team1_id' => 'required|exists:teams,id',
            'team2_id' => 'required|exists:teams,id|different:team1_id',
            'team1_score' => 'required|integer|min:0|max:21',
            'team2_score' => 'required|integer|min:0|max:21',
        ]);

        $game = Game::create($validated);
        return response()->json($game->load(['team1', 'team2']), 201);
    }

    public function show(Game $game)
    {
        return $game->load(['team1', 'team2']);
    }

    public function update(Request $request, Game $game)
    {
        $validated = $request->validate([
            'team1_score' => 'required|integer|min:0|max:21',
            'team2_score' => 'required|integer|min:0|max:21',
        ]);

        $game->update($validated);
        return response()->json($game->load(['team1', 'team2']));
    }

    public function destroy(Game $game)
    {
        $game->delete();
        return response()->json(null, 204);
    }
}
