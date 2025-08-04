<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\GameResource;
use App\Models\Game;
use App\Models\League;
use App\Models\Team;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules\File;

class GameController extends Controller
{
    public function index(Request $request, ?League $league)
    {
        $games = Game::with(['league', 'teams', 'teams.players'])
            ->when($request->has('search'), function ($query) use ($request) {
                $query->whereHas('teams.players', function ($query) use ($request) {
                    $query->where('name', 'like', "%{$request->search}%");
                });
            })
            ->when($league, function ($query) use ($league) {
                $query->where('league_id', $league->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return GameResource::collection($games);
    }

    public function store(Request $request)
    {
        if (!$request->user()->leagues->contains($request->league_id)) {
            return response('You do not belong to this league', 403);
        }

        $validated = $request->validate([
            'league_id' => ['required', 'exists:leagues,id'],
            'team1' => ['required', 'array', 'min:1'],
            'team1.*' => ['required', 'exists:users,id'],
            'team2' => ['required', 'array', 'min:1'],
            'team2.*' => ['required', 'exists:users,id'],
            'team1_score' => ['required', 'integer', 'min:0', 'max:100'],
            'team2_score' => ['required', 'integer', 'min:0', 'max:100'],
            'date' => ['required', 'date', 'before:now'],
            'video' => [
                'nullable',
                File::types(['mp4', 'webm', 'mov'])
                    ->min('1kb')
                    ->max('500mb'),
            ],
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

        ['game' => $game, 'video' => $video] = DB::transaction(function () use ($t2, $t1, $request, $validated) {
            $game = Game::create([
                'league_id' => $validated['league_id'],
                'created_at' => $validated['date'],
            ]);

            $team1Player1Id = $validated['team1'][0];
            $team1Player2Id = $validated['team1'][1];
            $team1PlayerIds = collect([$team1Player1Id, $team1Player2Id]);
            $team1 = Team::whereHas('players', function ($query) use ($team1PlayerIds) {
                $query->whereIn('users.id', $team1PlayerIds);
            }, '=', $team1PlayerIds->count())
                ->whereDoesntHave('players', function ($query) use ($team1PlayerIds) {
                    $query->whereNotIn('users.id', $team1PlayerIds);
                })
                ->first();

            if (!$team1) {
                $team1 = Team::create();
                $team1->players()->attach($team1PlayerIds);
            }

            $team2Player1Id = $validated['team2'][0];
            $team2Player2Id = $validated['team2'][1];
            $team2PlayerIds = collect([$team2Player1Id, $team2Player2Id]);
            $team2 = Team::whereHas('players', function ($query) use ($team2PlayerIds) {
                $query->whereIn('users.id', $team2PlayerIds);
            }, '=', $team1PlayerIds->count())
                ->whereDoesntHave('players', function ($query) use ($team2PlayerIds) {
                    $query->whereNotIn('users.id', $team2PlayerIds);
                })
                ->first();

            if (!$team2) {
                $team2 = Team::create();
                $team2->players()->attach($team2PlayerIds);
            }

            $game->teams()->attach($team1, ['score' => $validated['team1_score'], 'won' => $t1 > $t2]);
            $game->teams()->attach($team2, ['score' => $validated['team2_score'], 'won' => $t2 > $t1]);

            $team1->players->each->increment('games_played');
            $team2->players->each->increment('games_played');
            if ($validated['team1_score'] > $validated['team2_score']) {
                $team1->players->each->increment('games_won');
            } else {
                $team2->players->each->increment('games_won');
            }

            // Handle video upload if present
            $videoData = null;
            if ($request->has('video') && isset($validated['video'])) {

                try {
                    $media = $game
                        ->addMediaFromRequest('video')
                        ->toMediaCollection('videos');

                    $videoData = [
                        'id' => $media->id,
                        'url' => $media->getUrl(),
                        'size' => $media->size,
                        'name' => $media->name,
                    ];
                } catch (Exception $e) {
                    Log::error('Video upload failed: ' . $e->getMessage());
                    throw new Exception('The video failed to upload.', previous: $e);
                }
            }

            return [
                'game' => $game,
                'video' => $videoData,
            ];
        });

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Game created successfully',
                'game' => [
                    'id' => $game->id,
                    'league_id' => $game->league_id,
                    'created_at' => $game->created_at,
                ],
                'video' => $video,
            ]);
        }

        return redirect()->back();
    }

    public function destroy(Request $request, Game $game)
    {
        Gate::authorize('delete-games', $game->league);

        $game->teams()->detach($game->teams->pluck('id'));

        $game->delete();

        return redirect()->back();
    }
}
