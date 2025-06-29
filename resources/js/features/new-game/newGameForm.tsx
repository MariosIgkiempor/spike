import { PlayerInput } from '@/components/PlayerInput';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { NumberInput } from '@/components/ui/number-input';
import { League } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { FC, FormEvent } from 'react';
import { toast } from 'sonner';

type NewGameFormData = {
    league_id: number;
    team1: number[];
    team2: number[];
    team1_score: number;
    team2_score: number;
    date: Date;
};

type NewGameFormProps = {
    league: League;
    teams: number[][];
    onTeamsChange: (teams: number[][]) => void;
};

export const NewGameForm: FC<NewGameFormProps> = ({ league, teams, onTeamsChange }) => {
    const { data, setData, post, processing, errors, transform, reset } = useForm<NewGameFormData>({
        league_id: league.id,
        team1: [],
        team2: [],
        team1_score: 21,
        team2_score: 21,
        date: new Date(),
    });

    const team1Error = errors.team1 || errors.team1_score;
    const team2Error = errors.team2 || errors.team2_score;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        transform((data) => ({
            ...data,
            team1: teams[0],
            team2: teams[1],
        }));

        post(route('api.games.store'), {
            onSuccess: () => {
                router.reload();
                toast.success('Game created');
                reset('team1_score', 'team2_score');
            },
        });
    };

    const handleTeamChange = (teamIndex: number, playerIndex: number, playerId: number | null) => {
        const newTeams = teams.map((team) => team.map((p) => p));
        if (playerId) {
            newTeams[teamIndex][playerIndex] = playerId;
        } else {
            newTeams[teamIndex].splice(playerIndex);
        }
        onTeamsChange(newTeams);
    };

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
                        onChange={(value) => handleTeamChange(1, 0, value)}
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

            <div className="flex justify-center">
                <Button type="submit" disabled={processing} size="lg">
                    Create Game
                </Button>
            </div>
        </form>
    );
};
