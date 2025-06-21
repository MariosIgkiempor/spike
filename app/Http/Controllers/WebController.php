<?php

namespace App\Http\Controllers;

use App\Http\Resources\LeagueResource;
use App\Models\League;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebController extends Controller
{
    public function home(Request $request)
    {
        return Inertia::render('games');
    }

    public function league(Request $request, League $league)
    {
        return Inertia::render('league', [
            'league' => LeagueResource::make($league)
        ]);
    }
}
