import { PlayerInput } from '@/components/PlayerInput';
import { Button } from '@/components/ui/button';
import { DatePickerDemo } from '@/components/ui/date-picker';
import { NumberInput } from '@/components/ui/number-input';
import { League } from '@/types';
import { useForm } from '@inertiajs/react';
import { FC, FormEvent } from 'react';
import { toast } from 'sonner';

interface NewGameFormProps {
    league: League;
}

type NewGameFormData = {
    league_id: number;
    team1_player1_id: number | null;
    team1_player2_id: number | null;
    team2_player1_id: number | null;
    team2_player2_id: number | null;
    team1_score: number;
    team2_score: number;
    date: Date;
};

export const NewGameForm: FC<NewGameFormProps> = ({ league }) => {
    const { data, setData, post, processing, errors } = useForm<NewGameFormData>({
        league_id: league.id,
        team1_player1_id: null,
        team1_player2_id: null,
        team2_player1_id: null,
        team2_player2_id: null,
        team1_score: 21,
        team2_score: 21,
        date: new Date(),
    });

    const team1Error = errors.team1_player1_id || errors.team1_player2_id || errors.team1_score;
    const team2Error = errors.team2_player1_id || errors.team2_player2_id || errors.team2_score;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('api.games.store'), {
            onSuccess: () => {
                toast.success('Game created');
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto_1fr]">
                {/* Team 1 */}
                <div className="w-full space-y-4">
                    {team1Error && <div className="mb-2 text-sm text-red-500">{team1Error}</div>}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <PlayerInput
                                leagueId={league.id}
                                value={data.team1_player1_id}
                                onChange={(value) => setData('team1_player1_id', value)}
                                label="Player 1"
                                error={errors.team1_player1_id}
                            />
                        </div>
                        <div className="flex-1">
                            <PlayerInput
                                leagueId={league.id}
                                value={data.team1_player2_id}
                                onChange={(value) => setData('team1_player2_id', value)}
                                label="Player 2"
                                error={errors.team1_player2_id}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <NumberInput
                            value={data.team1_score}
                            onChange={(value) => setData('team1_score', value)}
                            min={0}
                            max={100}
                            className="w-48 text-4xl"
                        />
                    </div>
                </div>

                {/* VS */}
                <div className="px-4 py-4 text-6xl font-bold text-muted-foreground md:py-0">VS</div>

                {/* Team 2 */}
                <div className="w-full space-y-4">
                    {team2Error && <div className="mb-2 text-sm text-red-500">{team2Error}</div>}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <PlayerInput
                                leagueId={league.id}
                                value={data.team2_player1_id}
                                onChange={(value) => setData('team2_player1_id', value)}
                                label="Player 1"
                                error={errors.team2_player1_id}
                            />
                        </div>
                        <div className="flex-1">
                            <PlayerInput
                                leagueId={league.id}
                                value={data.team2_player2_id}
                                onChange={(value) => setData('team2_player2_id', value)}
                                label="Player 2"
                                error={errors.team2_player2_id}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <NumberInput
                            value={data.team2_score}
                            onChange={(value) => setData('team2_score', value)}
                            min={0}
                            max={100}
                            className="w-48 text-4xl"
                        />
                    </div>
                </div>

                <div></div>
                <DatePickerDemo value={data.date} onChange={(value) => setData('date', value!)} />
            </div>

            <div className="flex justify-center">
                <Button type="submit" disabled={processing} size="lg">
                    Create Game
                </Button>
            </div>
        </form>
    );
};
