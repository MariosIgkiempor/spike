<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\League;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class SeasonController extends Controller
{
    public function store(Request $request, League $league)
    {
        Gate::authorize('startSeason', $league);

        $validated = $request->validate([
            'custom_name' => ['nullable', 'string', 'max:255'],
        ]);

        DB::transaction(function () use ($league, $validated) {
            $activeSeason = $league->seasons()->where('is_active', true)->lockForUpdate()->first();
            if ($activeSeason) {
                $activeSeason->update([
                    'is_active' => false,
                    'ended_at' => now(),
                ]);
            }

            $nextNumber = $league->seasons()->max('number') + 1;

            $league->seasons()->create([
                'number' => $nextNumber,
                'custom_name' => $validated['custom_name'] ?? null,
                'is_active' => true,
                'started_at' => now(),
            ]);
        });

        return redirect()->back();
    }
}
