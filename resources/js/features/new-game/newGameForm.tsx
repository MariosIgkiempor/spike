import { PlayerInput } from '@/components/PlayerInput';
import { Button } from '@/components/ui/button';
import { NumberInput } from '@/components/ui/number-input';
import { User } from '@/types';
import { useForm } from '@inertiajs/react';
import { FC, FormEvent } from 'react';

interface NewGameFormProps {
    initialTeams?: {
        team1: User[];
        team2: User[];
    };
}

export const NewGameForm: FC<NewGameFormProps> = ({ initialTeams }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        team1_player1_id: initialTeams?.team1[0]?.id || null,
        team1_player2_id: initialTeams?.team1[1]?.id || null,
        team2_player1_id: initialTeams?.team2[0]?.id || null,
        team2_player2_id: initialTeams?.team2[1]?.id || null,
        team1_score: 21,
        team2_score: 21,
    });

    const team1Error = errors.team1_player1_id || errors.team1_player2_id || errors.team1_score;
    const team2Error = errors.team2_player1_id || errors.team2_player2_id || errors.team2_score;

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        post(route('api.games.store'), {
            onSuccess: () => {
                reset();
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
                                value={data.team1_player1_id}
                                onChange={(value) => setData('team1_player1_id', value)}
                                label="Player 1"
                                error={errors.team1_player1_id}
                            />
                        </div>
                        <div className="flex-1">
                            <PlayerInput
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
                                value={data.team2_player1_id}
                                onChange={(value) => setData('team2_player1_id', value)}
                                label="Player 1"
                                error={errors.team2_player1_id}
                            />
                        </div>
                        <div className="flex-1">
                            <PlayerInput
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
            </div>

            <div className="flex justify-center">
                <Button type="submit" disabled={processing} size="lg">
                    Create Game
                </Button>
            </div>
        </form>
    );
};
