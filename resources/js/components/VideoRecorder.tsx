import { useEffect, useRef, useState } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import { Button } from './ui/button';

interface VideoRecorderProps {
    onVideoReady: (blob: Blob) => void;
    onCancel?: () => void;
}

export const VideoRecorder = ({ onVideoReady, onCancel }: VideoRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [showPreview, setShowPreview] = useState(false);
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
    const [customVideoUrl, setCustomVideoUrl] = useState<string | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const recordedVideoRef = useRef<HTMLVideoElement>(null);

    const { status, startRecording, stopRecording, mediaBlobUrl, previewStream, clearBlobUrl } = useReactMediaRecorder({
        video: {
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
            facingMode: 'environment'
        },
        audio: true,
        askPermissionOnMount: true,
        mediaRecorderOptions: MediaRecorder.isTypeSupported('video/mp4; codecs=h264') 
            ? { mimeType: 'video/mp4; codecs=h264' }
            : MediaRecorder.isTypeSupported('video/webm; codecs=vp9') 
            ? { mimeType: 'video/webm; codecs=vp9' }
            : { mimeType: 'video/webm' },
        onStop: (blobUrl, blob) => {
            console.log('Recording stopped:', { blobUrl, blob, size: blob?.size, type: blob?.type });
            setIsRecording(false);
            
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            
            if (blob && blob.size > 1000) { // Ensure blob has meaningful content
                setRecordedBlob(blob);
                // Create a fresh URL for better playback compatibility
                const videoUrl = URL.createObjectURL(blob);
                setCustomVideoUrl(videoUrl);
                console.log('Created custom video URL:', videoUrl);
                setShowPreview(true);
            } else {
                console.error('Recording failed: blob is empty or too small', blob);
                alert('Recording failed. Please try again.');
                setShowPreview(false);
            }
        },
    });

    // Attach preview stream to video element
    useEffect(() => {
        if (previewVideoRef.current && previewStream) {
            previewVideoRef.current.srcObject = previewStream;
        }
    }, [previewStream]);

    // Cleanup custom video URL when component unmounts
    useEffect(() => {
        return () => {
            if (customVideoUrl) {
                URL.revokeObjectURL(customVideoUrl);
            }
        };
    }, [customVideoUrl]);

    // Force video reload when URL changes
    useEffect(() => {
        if (recordedVideoRef.current && (customVideoUrl || mediaBlobUrl)) {
            const video = recordedVideoRef.current;
            video.src = customVideoUrl || mediaBlobUrl || '';
            video.load();
            console.log('Manually set video src:', video.src);
        }
    }, [customVideoUrl, mediaBlobUrl]);


    const handleStartRecording = () => {
        setIsRecording(true);
        setRecordingTime(0);
        setShowPreview(false);
        startRecording();

        // Start timer
        intervalRef.current = setInterval(() => {
            setRecordingTime((time) => time + 1);
        }, 1000);
    };

    const handleStopRecording = () => {
        if (recordingTime < 2) {
            alert('Please record for at least 2 seconds');
            return;
        }
        stopRecording();
    };

    const handleUseVideo = async () => {
        if (recordedBlob) {
            // Use the blob directly, no need to fetch
            onVideoReady(recordedBlob);
        } else if (mediaBlobUrl) {
            try {
                const response = await fetch(mediaBlobUrl);
                const blob = await response.blob();
                onVideoReady(blob);
            } catch (error) {
                console.error('Error converting video:', error);
            }
        }
    };

    const handleRetryRecording = () => {
        clearBlobUrl();
        setShowPreview(false);
        setRecordingTime(0);
        setRecordedBlob(null);
        // Clean up the custom URL
        if (customVideoUrl) {
            URL.revokeObjectURL(customVideoUrl);
            setCustomVideoUrl(null);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusMessage = () => {
        switch (status) {
            case 'permission_denied':
                return 'Camera permission denied. Please allow camera access.';
            case 'no_specified_media_found':
                return 'No camera found. Please check your device.';
            case 'media_in_use':
                return 'Camera is in use by another application.';
            case 'acquiring_media':
                return 'Accessing camera...';
            default:
                return null;
        }
    };

    const statusMessage = getStatusMessage();

    if (statusMessage) {
        return (
            <div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 p-8">
                <p className="mb-4 text-red-600">{statusMessage}</p>
                {onCancel && (
                    <Button onClick={onCancel} variant="outline">
                        Cancel
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-4">
            {/* Camera Preview / Recorded Video */}
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                {!showPreview ? (
                    // Live camera preview
                    <video ref={previewVideoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
                ) : (
                    // Recorded video preview
                    <video
                        ref={recordedVideoRef}
                        src={customVideoUrl || mediaBlobUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="h-full w-full"
                        style={{ backgroundColor: 'black' }}
                        onError={(e) => {
                            console.error('Video playback error:', e);
                            console.log('Custom video URL:', customVideoUrl);
                            console.log('MediaRecorder URL:', mediaBlobUrl);
                            console.log('Recorded blob:', recordedBlob);
                        }}
                        onLoadStart={() => console.log('Video load started')}
                        onCanPlay={() => console.log('Video can play')}
                        onLoadedMetadata={(e) => {
                            const video = e.target as HTMLVideoElement;
                            console.log('Video metadata loaded:', {
                                duration: video.duration,
                                videoWidth: video.videoWidth,
                                videoHeight: video.videoHeight,
                                readyState: video.readyState,
                                src: video.src
                            });
                        }}
                        onPlay={() => console.log('Video started playing')}
                        onPause={() => console.log('Video paused')}
                    />
                )}

                {/* Recording indicator */}
                {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center space-x-2 rounded-full bg-red-600 px-3 py-1 text-white">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-white" />
                        <span className="text-sm font-medium">REC {formatTime(recordingTime)}</span>
                    </div>
                )}

                {/* Camera flip button (for mobile) */}
                {!isRecording && !showPreview && (
                    <button
                        className="absolute top-4 right-4 rounded-full bg-black/50 p-2 text-white"
                        onClick={() => {
                            // Toggle camera (front/back) - this would need additional implementation
                        }}
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                        </svg>
                    </button>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4">
                {!showPreview ? (
                    // Recording controls
                    <>
                        {!isRecording ? (
                            <Button
                                onClick={handleStartRecording}
                                disabled={status !== 'idle'}
                                className="rounded-full bg-red-600 px-8 py-3 text-white hover:bg-red-700"
                            >
                                Start Recording
                            </Button>
                        ) : (
                            <Button onClick={handleStopRecording} className="rounded-full bg-gray-600 px-8 py-3 text-white hover:bg-gray-700">
                                Stop Recording
                            </Button>
                        )}

                        {onCancel && (
                            <Button onClick={onCancel} variant="outline">
                                Cancel
                            </Button>
                        )}
                    </>
                ) : (
                    // Preview controls
                    <>
                        <Button onClick={handleUseVideo} className="bg-green-600 text-white hover:bg-green-700">
                            Use This Video
                        </Button>
                        <Button onClick={handleRetryRecording} variant="outline">
                            Record Again
                        </Button>
                        {onCancel && (
                            <Button onClick={onCancel} variant="outline">
                                Cancel
                            </Button>
                        )}
                    </>
                )}
            </div>

            {/* Recording tips */}
            {!isRecording && !showPreview && (
                <div className="space-y-1 text-center text-sm text-gray-600">
                    <p>Tips for best quality:</p>
                    <ul className="mx-auto max-w-md list-inside list-disc space-y-1 text-left">
                        <li>Hold your device horizontally (landscape)</li>
                        <li>Ensure good lighting on the court</li>
                        <li>Keep the camera steady during recording</li>
                        <li>Position to capture the entire court if possible</li>
                    </ul>
                </div>
            )}
        </div>
    );
};
