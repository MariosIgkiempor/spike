import { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from './ui/button';
import { route } from 'ziggy-js';

interface VideoPlayerProps {
  gameId: number;
  className?: string;
}

interface VideoData {
  id: number;
  url: string;
  thumbnail?: string;
  preview?: string;
  size: number;
  duration: number;
  created_at: string;
}

const fetchGameVideo = async (gameId: number): Promise<VideoData> => {
  const response = await fetch(route('api.games.video.show', { game: gameId }));
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No video found for this game');
    }
    throw new Error('Failed to load video');
  }
  
  const data = await response.json();
  return data.video;
};

const deleteGameVideo = async (gameId: number) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  const response = await fetch(route('api.games.video.destroy', { game: gameId }), {
    method: 'DELETE',
    headers: {
      ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete video');
  }

  return response.json();
};

export const VideoPlayer = ({ gameId, className = '' }: VideoPlayerProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { data: video, isLoading, error, refetch } = useQuery({
    queryKey: ['game-video', gameId],
    queryFn: () => fetchGameVideo(gameId),
    retry: false,
  });

  const deleteVideoMutation = useMutation({
    mutationFn: () => deleteGameVideo(gameId),
    onSuccess: () => {
      setShowDeleteConfirm(false);
      refetch(); // This will cause the component to show "no video" state
    },
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${Math.round(mb * 10) / 10}MB`;
  };

  const handleDelete = () => {
    deleteVideoMutation.mutate();
  };

  const handleFullscreen = () => {
    if (videoRef.current) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading video...</span>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg ${className}`}>
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No Video Available</h3>
        <p className="text-gray-500 text-center">
          {error?.message || 'No video has been recorded for this game yet.'}
        </p>
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className={`p-6 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <h3 className="text-lg font-semibold text-red-800 mb-2">Delete Video?</h3>
        <p className="text-red-700 mb-4">
          Are you sure you want to delete this game video? This action cannot be undone.
        </p>
        <div className="flex space-x-2">
          <Button
            onClick={handleDelete}
            disabled={deleteVideoMutation.isPending}
            className="bg-red-600 hover:bg-red-700"
          >
            {deleteVideoMutation.isPending ? 'Deleting...' : 'Delete Video'}
          </Button>
          <Button
            onClick={() => setShowDeleteConfirm(false)}
            variant="outline"
            disabled={deleteVideoMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={video.url}
          poster={video.thumbnail}
          controls
          className="w-full h-auto"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Fullscreen button overlay */}
        <button
          onClick={handleFullscreen}
          className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded opacity-0 hover:opacity-100 transition-opacity"
          title="Fullscreen"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Video Info & Controls */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Duration:</span> {formatDuration(video.duration)} • 
          <span className="font-medium ml-2">Size:</span> {formatFileSize(video.size)} •
          <span className="font-medium ml-2">Recorded:</span> {new Date(video.created_at).toLocaleDateString()}
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => {
              const link = document.createElement('a');
              link.href = video.url;
              link.download = `game-${gameId}-video.mp4`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            variant="outline"
            size="sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download
          </Button>
          
          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </Button>
        </div>
      </div>

      {/* Video Preview Thumbnail (if available) */}
      {video.preview && (
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">Preview thumbnail:</p>
          <img 
            src={video.preview} 
            alt="Video preview" 
            className="max-w-xs mx-auto rounded border"
          />
        </div>
      )}
    </div>
  );
};