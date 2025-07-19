<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\File;

class GameVideoController extends Controller
{
    public function upload(Request $request, Game $game)
    {
        $request->validate([
            'video' => [
                'required',
                File::types(['mp4', 'webm', 'mov'])
                    ->min('1mb')
                    ->max('500mb'),
            ]
        ]);

        // Remove existing video if present
        $game->clearMediaCollection('videos');

        // Add new video
        $media = $game
            ->addMediaFromRequest('video')
            ->toMediaCollection('videos');

        return response()->json([
            'message' => 'Video uploaded successfully',
            'video' => [
                'id' => $media->id,
                'url' => $media->getUrl(),
                'size' => $media->size,
                'name' => $media->name,
                'duration' => $media->getCustomProperty('duration'),
                'compressed' => $media->getCustomProperty('compressed', false),
                'compression_ratio' => $media->getCustomProperty('compression_ratio'),
            ]
        ]);
    }

    public function show(Game $game)
    {
        if (!$game->hasVideo()) {
            return response()->json(['message' => 'No video found'], 404);
        }

        $video = $game->video;

        return response()->json([
            'video' => [
                'id' => $video->id,
                'url' => $video->getUrl(),
                'thumbnail' => $video->hasGeneratedConversion('thumbnail') 
                    ? $video->getUrl('thumbnail') 
                    : null,
                'preview' => $video->hasGeneratedConversion('preview') 
                    ? $video->getUrl('preview') 
                    : null,
                'size' => $video->size,
                'duration' => $video->getCustomProperty('duration'),
                'created_at' => $video->created_at,
            ]
        ]);
    }

    public function destroy(Game $game)
    {
        $game->clearMediaCollection('videos');

        return response()->json(['message' => 'Video deleted successfully']);
    }
}