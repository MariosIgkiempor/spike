<?php

namespace App\Providers;

use App\Listeners\ProcessVideoMetadata;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;
use Spatie\MediaLibrary\MediaCollections\Events\MediaHasBeenAddedEvent;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::unguard();
        Model::shouldBeStrict();
        Model::automaticallyEagerLoadRelationships();
        Date::use(CarbonImmutable::class);

        // Register video processing listener
        Event::listen(
            MediaHasBeenAddedEvent::class,
            ProcessVideoMetadata::class
        );
    }
}
