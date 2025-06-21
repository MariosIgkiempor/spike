<?php

namespace App\Http\Controllers;

use App\Models\League;
use Illuminate\Http\Request;

class LeagueController extends Controller
{
    public function index()
    {
        //
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:1', 'max:255']
        ]);

        $league = League::create([
            ...$validated,
            'user_id' => $request->user()->id,
        ]);

        $request->user()->update([
            'current_league_id' => $league->id,
        ]);

        $request->user()->leagues()->attach($league->id);

        return redirect()->route('web.leagues.show', $league->id);
    }

    public function create()
    {
        //
    }

    public function update(Request $request, string $id)
    {
        $request->validate([

        ]);
    }

    public function show(string $id)
    {
        //
    }

    public function edit(string $id)
    {
        //
    }

    public function destroy(string $id)
    {
        //
    }
}
