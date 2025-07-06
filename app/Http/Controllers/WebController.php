<?php

namespace App\Http\Controllers;

use App\Http\Resources\LeagueResource;
use App\Models\League;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
