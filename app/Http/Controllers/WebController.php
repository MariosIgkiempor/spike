<?php

namespace App\Http\Controllers;

use App\Http\Resources\LeagueResource;
use App\Http\Resources\UserResource;
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
            'gamesByMonth' => fn() => $request->user()->gamesByMonth(),
            'totalGames' => fn() => $request->user()->games()->count(),
            'winRate' => fn() => $request->user()->winRate(),
        ]);
    }

    public function league(Request $request, League $league)
    {
        if ($request->user()->leagues->doesntContain($league)) {
            return redirect()->route('dashboard');
        }

        return Inertia::render('league', [
            'league' => fn() => LeagueResource::make($league),
            'players' => fn() => UserResource::collection($league->users),
            'leaderboard' => fn() => $league->leaderboard(),
            'teamStats' => fn() => $league->teamStats(),
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
