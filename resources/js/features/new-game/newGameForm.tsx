import { PlayerInput } from '@/components/PlayerInput';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { NumberInput } from '@/components/ui/number-input';
import { VideoRecorder } from '@/components/VideoRecorder';
import { League } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { FC, FormEvent, useState } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

type NewGameFormData = {
    league_id: number;
    team1: number[];
    team2: number[];
    team1_score: number;
    team2_score: number;
    date: Date;
    video?: File | null;
};

type NewGameFormProps = {
    league: League;
    teams: number[][];
    onTeamsChange: (teams: number[][]) => void;
};

export const NewGameForm: FC<NewGameFormProps> = ({ league, teams, onTeamsChange }) => {
    const [currentStep, setCurrentStep] = useState<'form' | 'video'>('form');
    const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<NewGameFormData>({
        league_id: league.id,
        team1: [],
        team2: [],
        team1_score: 21,
        team2_score: 21,
        date: new Date(),
        video: null,
    });

    const team1Error = errors.team1 || errors.team1_score;
    const team2Error = errors.team2 || errors.team2_score;

    const handleStartVideoRecording = () => {
        setCurrentStep('video');
    };

    const handleVideoReady = (blob: Blob) => {
        setRecordedVideoBlob(blob);
        // Convert blob to File for Inertia
        const videoFile = new File([blob], 'game-recording.webm', { type: blob.type });
        setData('video', videoFile);
        setCurrentStep('form');
        toast.success('Video recorded! Now enter the game details.');
    };

    const handleCancelVideo = () => {
        setCurrentStep('form');
        setRecordedVideoBlob(null);
        setData('video', null);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Update teams in data before submitting
        setData((prevData) => ({
            ...prevData,
            team1: teams[0],
            team2: teams[1],
        }));

        post(route('api.games.store'), {
            onSuccess: () => {
                toast.success(data.video ? 'Game created and video uploaded successfully!' : 'Game created successfully!');
                // Reset and reload
                reset('team1_score', 'team2_score', 'video');
                setRecordedVideoBlob(null);
                setCurrentStep('form');
                router.reload();
            },
            onError: (errors) => {
                console.error('Error creating game:', errors);
                toast.error('Failed to create game. Please try again.');
            },
        });
    };

    const handleTeamChange = (teamIndex: number, playerIndex: number, playerId: number | null) => {
        const newTeams = teams.map((team) => [...team]);

        // Ensure the team array exists and has enough slots
        if (!newTeams[teamIndex]) {
            newTeams[teamIndex] = [];
        }

        if (playerId) {
            // Extend array if needed to accommodate the player index
            while (newTeams[teamIndex].length <= playerIndex) {
                newTeams[teamIndex].push(0); // placeholder
            }
            newTeams[teamIndex][playerIndex] = playerId;
        } else {
            // Remove player
            if (newTeams[teamIndex]?.[playerIndex]) {
                newTeams[teamIndex].splice(playerIndex, 1);
            }
        }
        onTeamsChange(newTeams);
    };

    // Step 1: Video Recording (optional)
    if (currentStep === 'video') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h2 className="mb-2 text-2xl font-bold text-gray-900">Record Your Game</h2>
                    <p className="text-gray-600">Start recording before you begin playing, then enter the scores after the game.</p>
                </div>

                <VideoRecorder onVideoReady={handleVideoReady} onCancel={handleCancelVideo} />
            </div>
        );
    }

    // Default game creation form
    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 justify-items-center gap-8 lg:grid-cols-[_1fr_100px__1fr]">
                {/* Team 1 */}
                <div className="w-full max-w-sm space-y-4">
                    {team1Error && <div className="mb-2 text-sm text-red-500">{team1Error}</div>}
                    <PlayerInput
                        players={league.players}
                        value={teams[0]?.[0] ?? null}
                        onChange={(value) => handleTeamChange(0, 0, value)}
                        label="Player 1"
                        error={errors.team1}
                    />
                    <PlayerInput
                        players={league.players}
                        value={teams[0]?.[1] ?? null}
                        onChange={(value) => handleTeamChange(0, 1, value)}
                        label="Player 2"
                        error={errors.team1}
                    />
                    <NumberInput
                        value={data.team1_score}
                        onChange={(value) => setData('team1_score', value)}
                        min={0}
                        max={100}
                        className="w-full text-4xl"
                    />
                </div>

                {/* VS */}
                <div className="px-4 py-4 text-6xl font-bold text-muted-foreground md:py-0">VS</div>

                {/* Team 2 */}
                <div className="w-full max-w-sm space-y-4">
                    {team2Error && <div className="mb-2 text-sm text-red-500">{team2Error}</div>}
                    <PlayerInput
                        players={league.players}
                        value={teams[1]?.[0] ?? null}
                        onChange={(value) => handleTeamChange(1, 0, value)}
                        label="Player 1"
                        error={errors.team2}
                    />
                    <PlayerInput
                        players={league.players}
                        value={teams[1]?.[1] ?? null}
                        onChange={(value) => handleTeamChange(1, 1, value)}
                        label="Player 2"
                        error={errors.team2}
                    />
                    <NumberInput
                        value={data.team2_score}
                        onChange={(value) => setData('team2_score', value)}
                        min={0}
                        max={100}
                        className="w-full text-4xl"
                    />
                </div>

                <div></div>
                <DatePicker value={data.date} onChange={(value) => setData('date', value!)} />
            </div>

            {/* Video Recording Section */}
            <div className="flex flex-col items-center space-y-4">
                {recordedVideoBlob ? (
                    <div className="flex items-center space-x-3 rounded-lg border border-green-200 bg-green-50 p-4">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-green-800">Video recorded successfully!</p>
                            <p className="text-sm text-green-600">Video will be uploaded when you create the game.</p>
                        </div>
                        <Button
                            type="button"
                            onClick={() => setRecordedVideoBlob(null)}
                            variant="outline"
                            size="sm"
                            className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                            Remove
                        </Button>
                    </div>
                ) : (
                    <Button
                        type="button"
                        onClick={handleStartVideoRecording}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                        <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                        </svg>
                        Record Game Video (Optional)
                    </Button>
                )}
            </div>

            <div className="flex justify-center">
                <Button type="submit" disabled={processing} size="lg">
                    {processing ? (
                        <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            {data.video ? 'Creating Game & Uploading Video...' : 'Creating Game...'}
                        </>
                    ) : data.video ? (
                        'Create Game & Upload Video'
                    ) : (
                        'Create Game'
                    )}
                </Button>
            </div>
        </form>
    );
};
