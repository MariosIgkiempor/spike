import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { VideoRecorder } from './VideoRecorder';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { route } from 'ziggy-js';

interface VideoData {
  id: number;
  size: number;
  compressed?: boolean;
  compression_ratio?: number;
}

interface VideoUploadProps {
  gameId: number;
  onUploadComplete?: (videoData: VideoData) => void;
  onCancel?: () => void;
}

const uploadVideo = async (gameId: number, videoBlob: Blob) => {
  const formData = new FormData();
  formData.append('video', videoBlob, 'game-recording.webm');

  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const response = await fetch(route('api.games.video.upload', { game: gameId }), {
    method: 'POST',
    body: formData,
    headers: {
      ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Upload failed');
  }

  return response.json();
};

export const VideoUpload = ({ gameId, onUploadComplete, onCancel }: VideoUploadProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (videoBlob: Blob) => uploadVideo(gameId, videoBlob),
    onSuccess: (data: { video: VideoData }) => {
      setIsProcessing(true);
      // Simulate processing time (in real app, you might poll for completion)
      setTimeout(() => {
        setIsProcessing(false);
        // Invalidate and refetch game data
        queryClient.invalidateQueries({ queryKey: ['game', gameId] });
        queryClient.invalidateQueries({ queryKey: ['games'] });
        
        if (onUploadComplete) {
          onUploadComplete(data.video);
        }
      }, 2000);
    },
    onError: (error: Error) => {
      console.error('Upload failed:', error);
    }
  });

  const handleVideoReady = (videoBlob: Blob) => {
    uploadMutation.mutate(videoBlob);
  };

  const getStatusMessage = () => {
    if (uploadMutation.isPending) {
      return 'Uploading video...';
    }
    if (isProcessing) {
      return 'Processing and compressing video...';
    }
    if (uploadMutation.isSuccess && !isProcessing) {
      return 'Video uploaded successfully!';
    }
    if (uploadMutation.isError) {
      return uploadMutation.error?.message || 'Upload failed';
    }
    return null;
  };

  // Success state
  if (uploadMutation.isSuccess && !isProcessing) {
    const videoData = uploadMutation.data?.video;
    
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-green-50 rounded-lg">
        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-green-800">Video Uploaded Successfully!</h3>
        <p className="text-green-700 text-center">
          Your game video has been uploaded and processed.
          {videoData?.compressed && (
            <span className="block text-sm mt-1">
              Video was compressed to {Math.round((videoData.size / (1024 * 1024)) * 100) / 100}MB
              {videoData.compression_ratio && ` (${videoData.compression_ratio}% of original size)`}
            </span>
          )}
        </p>
        <Button onClick={onCancel} className="mt-4">
          Continue
        </Button>
      </div>
    );
  }

  // Loading state (uploading or processing)
  if (uploadMutation.isPending || isProcessing) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-blue-50 rounded-lg">
        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center animate-spin">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-blue-800">{getStatusMessage()}</h3>
        <div className="w-full max-w-md">
          <Progress value={uploadMutation.isPending ? 50 : 100} className="w-full" />
        </div>
        {isProcessing && (
          <p className="text-sm text-blue-600 text-center">
            We're compressing your video to ensure optimal quality and file size.
            This may take a few moments...
          </p>
        )}
      </div>
    );
  }

  // Error state
  if (uploadMutation.isError) {
    return (
      <div className="flex flex-col items-center space-y-4 p-6 bg-red-50 rounded-lg">
        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-800">Upload Failed</h3>
        <p className="text-red-700 text-center">{uploadMutation.error?.message}</p>
        <div className="flex space-x-2">
          <Button 
            onClick={() => uploadMutation.reset()}
            variant="outline"
          >
            Try Again
          </Button>
          {onCancel && (
            <Button onClick={onCancel} variant="outline">
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Default recording state
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Record Game Video</h2>
        <p className="text-gray-600">
          Record your Spikeball game to capture the highlights and review plays later.
        </p>
      </div>

      <VideoRecorder 
        onVideoReady={handleVideoReady}
        onCancel={onCancel}
      />

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">📹 Video Guidelines</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Videos over 100MB will be automatically compressed</li>
          <li>• Recommended recording time: 5-15 minutes</li>
          <li>• Hold your device steady for best results</li>
          <li>• Ensure good lighting for clear video quality</li>
        </ul>
      </div>
    </div>
  );
};