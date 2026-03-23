import { PlayerInput } from '@/components/PlayerInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { NumberInput } from '@/components/ui/number-input';
import { LeaderboardUser } from '@/features/leaderboard/leaderboard-table';
import { cn } from '@/lib/utils';
import { League, User } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Calendar, Video } from 'lucide-react';
import { motion } from 'motion/react';
import { FC, FormEvent, ReactNode, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { route } from 'ziggy-js';

type NewGameFormData = {
    league_id: string;
    team1?: string[];
    team2?: string[];
    team1_score: number;
    team2_score: number;
    date: Date;
    video?: File | null;
};

type NewGameFormProps = {
    league: League;
    leaderboard: LeaderboardUser[];
    teams: string[][];
    onTeamsChange: (teams: string[][]) => void;
};

export const NewGameForm: FC<NewGameFormProps> = ({ league, leaderboard, teams, onTeamsChange }) => {
    const isFirstRender = useRef(true);
    useEffect(() => {
        isFirstRender.current = false;
    }, []);

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

    const handleTeamChange = (teamIndex: number, playerIndex: number, playerId: string | null) => {
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

    const allSelectedPlayerIds = [teams[0]?.[0], teams[0]?.[1], teams[1]?.[0], teams[1]?.[1]].filter((id): id is string => id != null);

    const disabledPlayerIdsFor = (teamIndex: number, playerIndex: number) =>
        allSelectedPlayerIds.filter((id) => id !== teams[teamIndex]?.[playerIndex]);

    const getPlayer = (playerId: string | null) => (playerId ? (league.players.find((p) => p.id === playerId) ?? null) : null);

    const getLeaderboardUser = (playerId: string | null) => (playerId ? (leaderboard.find((u) => u.id === playerId) ?? null) : null);

    const teamAvgMMR = (teamIndex: number) => {
        const players = (teams[teamIndex] ?? []).map((id) => getLeaderboardUser(id)).filter((u): u is LeaderboardUser => !!u);
        if (players.length === 0) return null;
        return Math.round(players.reduce((sum, u) => sum + u.mmr, 0) / players.length);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Team Matchup Scoreboard */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_auto_1fr]">
                    {/* Team A */}
                    <Card className="border-primary/20 pt-0">
                        <div className="h-1 bg-gradient-to-r from-primary to-primary/50" />
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-center justify-end gap-2">
                                {teamAvgMMR(0) !== null && <span className="text-sm text-muted-foreground">Avg {teamAvgMMR(0)} MMR</span>}
                                <h3 className="font-display text-xl tracking-wider text-primary uppercase">Team A</h3>
                            </div>

                            <div className="space-y-3">
                                <PlayerRow
                                    key={`player-0-${teams[0]?.[0] ?? 'empty'}`}
                                    player={getPlayer(teams[0]?.[0] ?? null)}
                                    shouldAnimate={!isFirstRender.current}
                                    staggerIndex={0}
                                >
                                    <PlayerInput
                                        players={league.players}
                                        leaderboard={leaderboard}
                                        value={teams[0]?.[0] ?? null}
                                        onChange={(value) => handleTeamChange(0, 0, value)}
                                        label="Player 1"
                                        error={errors.team1}
                                        mirrored
                                        disabledPlayerIds={disabledPlayerIdsFor(0, 0)}
                                    />
                                </PlayerRow>

                                <PlayerRow
                                    key={`player-1-${teams[0]?.[1] ?? 'empty'}`}
                                    player={getPlayer(teams[0]?.[1] ?? null)}
                                    shouldAnimate={!isFirstRender.current}
                                    staggerIndex={1}
                                >
                                    <PlayerInput
                                        players={league.players}
                                        leaderboard={leaderboard}
                                        value={teams[0]?.[1] ?? null}
                                        onChange={(value) => handleTeamChange(0, 1, value)}
                                        label="Player 2"
                                        error={errors.team1}
                                        mirrored
                                        disabledPlayerIds={disabledPlayerIdsFor(0, 1)}
                                    />
                                </PlayerRow>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">Score</span>
                                <div className="w-full font-display [&_input]:font-display [&_input]:text-4xl">
                                    <NumberInput
                                        value={data.team1_score}
                                        onChange={(value) => setData('team1_score', value)}
                                        min={0}
                                        max={100}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {team1Error && (
                                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{team1Error}</div>
                            )}
                        </CardContent>
                    </Card>

                    {/* VS Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.15, type: 'spring', stiffness: 200 }}
                        className="flex items-center justify-center self-center"
                    >
                        <div className="flex size-16 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary/80 shadow-lg lg:size-20">
                            <span className="font-display text-3xl tracking-wider text-secondary-foreground lg:text-4xl">VS</span>
                        </div>
                    </motion.div>

                    {/* Team B */}
                    <Card className="border-accent/20 pt-0">
                        <div className="h-1 bg-gradient-to-r from-accent/50 to-accent" />
                        <CardContent className="space-y-4 pt-4">
                            <div className="flex items-center gap-2">
                                <h3 className="font-display text-xl tracking-wider text-accent uppercase">Team B</h3>
                                {teamAvgMMR(1) !== null && <span className="text-sm text-muted-foreground">Avg {teamAvgMMR(1)} MMR</span>}
                            </div>

                            <div className="space-y-3">
                                <PlayerRow
                                    key={`player-2-${teams[1]?.[0] ?? 'empty'}`}
                                    player={getPlayer(teams[1]?.[0] ?? null)}
                                    shouldAnimate={!isFirstRender.current}
                                    staggerIndex={2}
                                >
                                    <PlayerInput
                                        players={league.players}
                                        leaderboard={leaderboard}
                                        value={teams[1]?.[0] ?? null}
                                        onChange={(value) => handleTeamChange(1, 0, value)}
                                        label="Player 1"
                                        error={errors.team2}
                                        disabledPlayerIds={disabledPlayerIdsFor(1, 0)}
                                    />
                                </PlayerRow>

                                <PlayerRow
                                    key={`player-3-${teams[1]?.[1] ?? 'empty'}`}
                                    player={getPlayer(teams[1]?.[1] ?? null)}
                                    shouldAnimate={!isFirstRender.current}
                                    staggerIndex={3}
                                >
                                    <PlayerInput
                                        players={league.players}
                                        leaderboard={leaderboard}
                                        value={teams[1]?.[1] ?? null}
                                        onChange={(value) => handleTeamChange(1, 1, value)}
                                        label="Player 2"
                                        error={errors.team2}
                                        disabledPlayerIds={disabledPlayerIdsFor(1, 1)}
                                    />
                                </PlayerRow>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <span className="text-sm font-semibold tracking-widest text-muted-foreground uppercase">Score</span>
                                <div className="w-full font-display [&_input]:font-display [&_input]:text-4xl">
                                    <NumberInput
                                        value={data.team2_score}
                                        onChange={(value) => setData('team2_score', value)}
                                        min={0}
                                        max={100}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {team2Error && (
                                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive">{team2Error}</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </motion.div>

            {/* Section 2: Game Details */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
                <Card className="bg-athletic-gradient">
                    <CardContent className="grid grid-cols-1 gap-6 pt-6 sm:grid-cols-2">
                        <div className="space-y-2">
                            <span className="flex items-center gap-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                <Calendar className="size-4" />
                                Game Date
                            </span>
                            <DatePicker value={data.date} onChange={(value) => setData('date', value!)} />
                        </div>

                        <div className="space-y-2">
                            <span className="flex items-center gap-2 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                                <Video className="size-4" />
                                Game Video
                            </span>
                            <label
                                htmlFor="video-upload"
                                className={cn(
                                    'flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground',
                                    data.video && 'border-primary/50 bg-primary/5 text-foreground',
                                )}
                            >
                                {data.video ? (
                                    <span className="font-semibold">{data.video.name}</span>
                                ) : (
                                    <span>Click to upload (.mp4, .webm, .mov)</span>
                                )}
                                <input
                                    id="video-upload"
                                    type="file"
                                    accept=".mp4,.webm,.mov"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] || null;
                                        setData('video', file);
                                    }}
                                    className="sr-only"
                                />
                            </label>
                            <p className="text-sm text-muted-foreground">Optional</p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Section 3: Submit */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.45 }}>
                <Button type="submit" disabled={processing} size="lg" className="w-full">
                    {processing ? (
                        <>
                            <div className="mr-2 size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                            Creating Game...
                        </>
                    ) : (
                        <span className="font-display text-lg tracking-wider uppercase">Record Game</span>
                    )}
                </Button>
            </motion.div>
        </form>
    );
};

const PlayerRow: FC<{
    player: User | null;
    shouldAnimate: boolean;
    staggerIndex: number;
    children: ReactNode;
}> = ({ player, shouldAnimate, staggerIndex, children }) => {
    return (
        <motion.div
            initial={shouldAnimate && player ? { opacity: 0, scale: 0.8, y: -10 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
                duration: 0.4,
                delay: player ? staggerIndex * 0.1 : 0,
                type: 'spring',
                stiffness: 300,
                damping: 15,
            }}
        >
            {children}
        </motion.div>
    );
};
