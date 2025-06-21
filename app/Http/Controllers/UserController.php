<?php

namespace App\Http\Controllers;

use App\Models\League;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function search(Request $request, ?League $league)
    {
        $search = $request->input('search');

        $users = User::query()
            ->when($search, function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($league, function ($query) use ($league) {
                $query->whereHas('leagues', function ($query) use ($league) {
                    $query->where('leagues.id', $league->id);
                });
            })
            ->limit(5)->get()->map(function ($user) {
                return [
                    'value' => $user->id,
                    'label' => $user->name,
                ];
            });

        return response()->json($users);
    }
}
