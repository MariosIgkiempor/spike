<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Team;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebController extends Controller
{
    public function home(Request $request)
    {
        return Inertia::render('games');
    }
}
