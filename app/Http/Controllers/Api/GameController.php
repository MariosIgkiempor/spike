<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Game;

class GameController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return Game::with(['team1', 'team2'])->get();
    }

    /**
     * Store a newly created resource in storage.
     */
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

    /**
     * Display the specified resource.
     */
    public function show(Game $game)
    {
        return $game->load(['team1', 'team2']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Game $game)
    {
        $validated = $request->validate([
            'team1_score' => 'required|integer|min:0|max:21',
            'team2_score' => 'required|integer|min:0|max:21',
        ]);

        $game->update($validated);
        return response()->json($game->load(['team1', 'team2']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Game $game)
    {
        $game->delete();
        return response()->json(null, 204);
    }
}
