<?php

namespace App\Models;

use Database\Factories\GameFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Game extends Model implements HasMedia
{
    /** @use HasFactory<GameFactory> */
    use HasFactory, InteractsWithMedia;

    public function teams(): BelongsToMany
    {
        return $this->belongsToMany(Team::class)
            ->withPivot(['score', 'won']);
    }

    public function league(): BelongsTo
    {
        return $this->belongsTo(League::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('videos')
            ->acceptsMimeTypes(['video/mp4', 'video/webm', 'video/mov'])
            ->singleFile();
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumbnail')
            ->width(640)
            ->height(360)
            ->quality(70)
            ->extractVideoFrameAtSecond(5)
            ->performOnCollections('videos');

        $this->addMediaConversion('preview')
            ->width(320)
            ->height(180)
            ->quality(60)
            ->extractVideoFrameAtSecond(5)
            ->performOnCollections('videos');

        $this->addMediaConversion('compressed')
            ->width(854)
            ->height(480)
            ->quality(75)
            ->performOnCollections('videos');
    }

    public function getVideoAttribute()
    {
        return $this->getFirstMedia('videos');
    }

    public function getVideoUrlAttribute()
    {
        return $this->video?->getUrl();
    }

    public function getVideoThumbnailAttribute()
    {
        return $this->video?->getUrl('thumbnail');
    }

    public function hasVideo(): bool
    {
        return $this->hasMedia('videos');
    }
}
