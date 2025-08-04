<?php

namespace App\Listeners;

use FFMpeg\Coordinate\Dimension;
use FFMpeg\FFMpeg;
use FFMpeg\FFProbe;
use FFMpeg\Format\Video\X264;
use Illuminate\Support\Facades\Log;
use Spatie\MediaLibrary\MediaCollections\Events\MediaHasBeenAddedEvent;

class ProcessVideoMetadata
{
    public function handle(MediaHasBeenAddedEvent $event): void
    {
        $media = $event->media;

        if ($media->collection_name === 'videos') {
            $this->processVideo($media);
        }
    }

    private function processVideo($media): void
    {
        try {
            $originalPath = $media->getPath();
            $originalSize = filesize($originalPath);

            // Extract metadata first
            $ffprobe = FFProbe::create();
            $duration = $ffprobe->format($originalPath)->get('duration');
            $dimensions = $ffprobe->streams($originalPath)->videos()->first()->getDimensions();

            // Store original metadata
            $media->setCustomProperty('original_duration', round($duration));
            $media->setCustomProperty('original_width', $dimensions->getWidth());
            $media->setCustomProperty('original_height', $dimensions->getHeight());
            $media->setCustomProperty('original_size', $originalSize);

            // Check if compression is needed (if over 100MB)
            $maxSize = 100 * 1024 * 1024; // 100MB in bytes

            if ($originalSize > $maxSize) {
                $this->compressVideo($media, $originalPath, $duration);
            } else {
                // Store metadata without compression
                $media->setCustomProperty('duration', round($duration));
                $media->setCustomProperty('width', $dimensions->getWidth());
                $media->setCustomProperty('height', $dimensions->getHeight());
                $media->setCustomProperty('compressed', false);
            }

            $media->save();

        } catch (\Exception $e) {
            Log::error('Failed to process video: '.$e->getMessage(), [
                'media_id' => $media->id,
                'file_path' => $media->getPath(),
            ]);
        }
    }

    private function compressVideo($media, $originalPath, $duration): void
    {
        try {
            $ffmpeg = FFMpeg::create();
            $video = $ffmpeg->open($originalPath);

            // Calculate target bitrate for 100MB
            $maxSize = 100 * 1024 * 1024; // 100MB in bytes
            $targetBitrate = (($maxSize * 8) / $duration) * 0.9; // 90% to leave room for audio
            $targetBitrate = max(500, min($targetBitrate, 2000)); // Between 500k and 2000k

            // Create compressed version
            $format = new X264('aac', 'libx264');
            $format->setKiloBitrate(intval($targetBitrate));
            $format->setAudioKiloBitrate(96); // 96k audio

            // Scale down if necessary (maintain aspect ratio)
            $probe = FFProbe::create();
            $dimensions = $probe->streams($originalPath)->videos()->first()->getDimensions();

            if ($dimensions->getWidth() > 854 || $dimensions->getHeight() > 480) {
                $video->filters()->resize(new Dimension(854, 480));
            }

            // Save compressed version
            $compressedPath = $this->getCompressedPath($originalPath);
            $video->save($format, $compressedPath);

            // Replace original with compressed
            if (file_exists($compressedPath)) {
                $compressedSize = filesize($compressedPath);

                // Only replace if actually smaller
                if ($compressedSize < filesize($originalPath)) {
                    unlink($originalPath);
                    rename($compressedPath, $originalPath);

                    // Update metadata
                    $media->setCustomProperty('duration', round($duration));
                    $media->setCustomProperty('width', min(854, $dimensions->getWidth()));
                    $media->setCustomProperty('height', min(480, $dimensions->getHeight()));
                    $media->setCustomProperty('compressed', true);
                    $media->setCustomProperty('compression_ratio', round($compressedSize / $media->getCustomProperty('original_size') * 100, 2));
                    $media->size = $compressedSize;
                } else {
                    // Compression didn't help, clean up
                    unlink($compressedPath);
                    $media->setCustomProperty('compressed', false);
                }
            }

        } catch (\Exception $e) {
            Log::error('Failed to compress video: '.$e->getMessage(), [
                'media_id' => $media->id,
                'original_path' => $originalPath,
            ]);
        }
    }

    private function getCompressedPath($originalPath): string
    {
        $pathInfo = pathinfo($originalPath);

        return $pathInfo['dirname'].'/'.$pathInfo['filename'].'_compressed.'.$pathInfo['extension'];
    }
}
