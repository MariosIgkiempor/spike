import { PlayerInput } from '@/components/PlayerInput';
import { Button, buttonVariants } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { NumberInput } from '@/components/ui/number-input';
import { League } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { FC, FormEvent } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

type NewGameFormData = {
    league_id: number;
    team1?: number[];
    team2?: number[];
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
    const { data, setData, post, transform, processing, errors, reset } = useForm<NewGameFormData>({
        league_id: league.id,
        team1_score: 21,
        team2_score: 21,
        date: new Date(),
        video: null,
    });

    const team1Error = errors.team1 || errors.team1_score;
    const team2Error = errors.team2 || errors.team2_score;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        transform((prevData) => ({
            ...prevData,
            team1: teams[0],
            team2: teams[1],
        }));

        post(route('api.games.store'), {
            onSuccess: () => {
                toast.success('Game created successfully!');
                reset();
                router.reload();
            },
            onError: (errors) => {
                console.error('Error creating game:', errors);
                toast.error('Failed to create game. Please try again.');
            },
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const handleTeamChange = (teamIndex: number, playerIndex: number, playerId: number | null) => {
        const newTeams = teams.map((team) => [...team]);

        // Ensure the team array exists and has enough slots
        if (!newTeams[teamIndex]) {
            newTeams[teamIndex] = [];
        }

        if (playerId) {
            if (newTeams[teamIndex]?.[playerIndex]) {
                newTeams[teamIndex][playerIndex] = playerId;
            } else {
                newTeams[teamIndex].push(playerId);
            }
        } else {
            newTeams[teamIndex].splice(playerIndex);
        }

        onTeamsChange(newTeams);
    };

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

            {/* Video Upload Section */}
            <div className="flex flex-col items-center space-y-4">
                <div className="w-full max-w-md">
                    <label htmlFor="video-upload" className="mb-2 block text-sm font-medium text-gray-700">
                        Upload Game Video (Optional)
                    </label>
                    <input
                        id="video-upload"
                        type="file"
                        accept=".mp4,.webm,.mov"
                        onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            console.log('Selected file:', file?.name, file?.type);
                            setData('video', file);
                        }}
                        className={buttonVariants({ variant: 'default' })}
                    />
                </div>
            </div>

            <div className="flex justify-center">
                <Button type="submit" disabled={processing} size="lg">
                    {processing ? (
                        <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Creating Game...
                        </>
                    ) : (
                        'Create Game'
                    )}
                </Button>
            </div>
        </form>
    );
};
