import { Button } from '@/components/ui/button';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import { Statistic } from '@/components/ui/statistic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Leaderboard, LeaderboardTable, LeaderboardUser } from '@/features/leaderboard/leaderboard-table';
import { NewGameForm } from '@/features/new-game/newGameForm';
import { RecentGames } from '@/features/recent-games/recent-games';
import { TeamStats } from '@/features/team-stats/team-stats';
import { UserAvatar, UserCard } from '@/features/users/user-card';
import Layout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { shuffleArray } from '@/lib/shuffle-array';
import { Game, League, PageProps, Resource, Team, User } from '@/types';
import { Head } from '@inertiajs/react';
import { format, isWithinInterval, startOfWeek, subWeeks } from 'date-fns';
import { ArrowRight, Check, HelpCircle, Plus, Scale, Shuffle, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Dispatch, FC, SetStateAction, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { toast } from 'sonner';

const CopyLeagueJoinLink: FC<{ league: League }> = ({ league }) => {
    const copyLink = () => {
        navigator.clipboard.writeText(route('web.leagues.join', { league: league.id })).then(
            () => {
                toast.success('Link copied');
            },
            () => {
                toast.error("Couldn't copy link");
            },
        );
    };

    return <Button onClick={copyLink}>Copy join link</Button>;
};

const GameGenerator: FC<{
    leaderboard: LeaderboardUser[];
    players: User[];
    selectedPlayers: number[];
    setSelectedPlayers: Dispatch<SetStateAction<number[]>>;
    generatedTeams: number[][];
    teamGenerationKey: number;
    onTeamsGenerated?: (teams: number[][]) => void;
    onSwitchToForm?: () => void;
}> = ({ leaderboard, players, selectedPlayers, setSelectedPlayers, generatedTeams, teamGenerationKey, onTeamsGenerated, onSwitchToForm }) => {
    const generateFairTeams = () => {
        // Map selected IDs to full user objects with MMR
        const selectedUsers = selectedPlayers.map((id) => leaderboard.find((u) => u.id === id)).filter((u): u is LeaderboardUser => !!u);

        // Sort by descending MMR
        const sorted = [...selectedUsers].sort((a, b) => b.mmr - a.mmr);

        // Greedy partition for balance
        const teamA: number[] = [];
        const teamB: number[] = [];
        let sumA = 0;
        let sumB = 0;

        sorted.forEach((user) => {
            if (sumA <= sumB) {
                teamA.push(user.id);
                sumA += user.mmr;
            } else {
                teamB.push(user.id);
                sumB += user.mmr;
            }
        });

        const teams = [teamA, teamB];
        onTeamsGenerated?.(teams);
    };

    const generateRandomTeams = () => {
        const indexes = [...Array(selectedPlayers.length).keys()];
        shuffleArray(indexes);

        const teamA: number[] = [];
        const teamB: number[] = [];
        indexes.forEach((index) => {
            if (teamA.length > teamB.length) {
                teamB.push(selectedPlayers[index]);
            } else {
                teamA.push(selectedPlayers[index]);
            }
        });

        const teams = [teamA, teamB];
        onTeamsGenerated?.(teams);
    };

    const teamMMR = (team: number[]) => {
        const players = team
            .map((playerId) => leaderboard.find((u) => u.id === playerId))
            .filter((u) => u !== undefined)
            .map((u) => u.mmr);
        return players.reduce((a, b) => a + b, 0);
    };

    const outPlayers = players.filter((p) => !selectedPlayers.includes(p.id));
    const inPlayers = selectedPlayers
        .map((id) => leaderboard.find((u) => u.id === id))
        .filter((u): u is LeaderboardUser => !!u);
    const isFull = selectedPlayers.length >= 4;
    const hasTeams = generatedTeams.length === 2 && generatedTeams[0].length > 0;

    return (
        <div className="space-y-6">
            {/* Top: Controls + Generated Teams */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
                <div className="h-1.5 bg-gradient-to-r from-primary via-secondary to-accent" />
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div
                                className={cn(
                                    'flex size-12 items-center justify-center rounded-xl transition-colors duration-300',
                                    isFull ? 'bg-primary/15' : 'bg-muted',
                                )}
                            >
                                <Users
                                    className={cn(
                                        'size-6 transition-colors duration-300',
                                        isFull ? 'text-primary' : 'text-muted-foreground',
                                    )}
                                />
                            </div>
                            {isFull && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                >
                                    <Check className="size-3" />
                                </motion.div>
                            )}
                        </div>
                        <div>
                            <h3 className="font-display text-xl uppercase tracking-wider">
                                {isFull ? 'Ready to Draft' : `Pick ${4 - selectedPlayers.length} More`}
                            </h3>
                            <div className="mt-1 flex gap-1.5">
                                {[0, 1, 2, 3].map((i) => (
                                    <motion.div
                                        key={i}
                                        initial={false}
                                        animate={{
                                            backgroundColor:
                                                i < selectedPlayers.length ? 'var(--primary)' : 'var(--muted)',
                                        }}
                                        className="h-1.5 w-8 rounded-full"
                                        transition={{ duration: 0.3, type: 'spring' }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button onClick={generateFairTeams} disabled={!isFull} size="lg" className="gap-2">
                            <Scale className="size-4" />
                            Fair Teams
                        </Button>
                        <Button
                            onClick={generateRandomTeams}
                            disabled={!isFull}
                            variant="secondary"
                            size="lg"
                            className="gap-2"
                        >
                            <Shuffle className="size-4" />
                            Random
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Generated Teams */}
            <AnimatePresence>
                {hasTeams && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.5, type: 'spring', bounce: 0.15 }}
                        className="overflow-hidden"
                    >
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-5">
                            {/* Team A */}
                            <motion.div
                                key={`teamA-${teamGenerationKey}`}
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-sm"
                            >
                                <div className="h-1 bg-gradient-to-r from-primary to-primary/40" />
                                <div className="p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h4 className="font-display text-lg uppercase tracking-wider text-primary">
                                            Team A
                                        </h4>
                                        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                                            {teamMMR(generatedTeams[0])} MMR
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {generatedTeams[0].map((id, i) => {
                                            const user = leaderboard.find((u) => u.id === id)!;
                                            return (
                                                <motion.div
                                                    key={`${id}-a-${teamGenerationKey}`}
                                                    initial={{ opacity: 0, x: -15 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                                                    className="flex items-center gap-3"
                                                >
                                                    <UserAvatar user={user} />
                                                    <div>
                                                        <div className="font-semibold leading-tight">{user.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {user.mmr} MMR
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>

                            {/* VS Badge */}
                            <motion.div
                                key={`vs-${teamGenerationKey}`}
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.4, delay: 0.2, type: 'spring', stiffness: 250 }}
                            >
                                <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary/80 shadow-lg sm:size-16">
                                    <span className="font-display text-2xl tracking-wider text-secondary-foreground sm:text-3xl">
                                        VS
                                    </span>
                                </div>
                            </motion.div>

                            {/* Team B */}
                            <motion.div
                                key={`teamB-${teamGenerationKey}`}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="overflow-hidden rounded-2xl border border-accent/25 bg-card shadow-sm"
                            >
                                <div className="h-1 bg-gradient-to-r from-accent/40 to-accent" />
                                <div className="p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h4 className="font-display text-lg uppercase tracking-wider text-accent">
                                            Team B
                                        </h4>
                                        <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-bold text-accent">
                                            {teamMMR(generatedTeams[1])} MMR
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {generatedTeams[1].map((id, i) => {
                                            const user = leaderboard.find((u) => u.id === id)!;
                                            return (
                                                <motion.div
                                                    key={`${id}-b-${teamGenerationKey}`}
                                                    initial={{ opacity: 0, x: 15 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                                                    className="flex items-center gap-3"
                                                >
                                                    <UserAvatar user={user} />
                                                    <div>
                                                        <div className="font-semibold leading-tight">{user.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {user.mmr} MMR
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.7 }}
                            className="mt-4 flex justify-center"
                        >
                            <Button onClick={onSwitchToForm} size="lg" className="gap-2">
                                <ArrowRight className="size-4" />
                                Record Score
                            </Button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Player Selection Lists */}
            <div className="grid grid-cols-2 gap-5">
                {/* Available players */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg uppercase tracking-wider text-muted-foreground">
                            Available
                        </h3>
                        <span className="text-sm font-medium text-muted-foreground">{outPlayers.length}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <AnimatePresence mode="popLayout">
                            {outPlayers.map((player, index) => {
                                const lbUser = leaderboard.find((u) => u.id === player.id);
                                return (
                                    <motion.button
                                        key={player.id}
                                        layout
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                                        onClick={() => setSelectedPlayers((prev) => [...prev, player.id])}
                                        disabled={isFull}
                                        className="group flex items-center gap-3 rounded-xl border border-transparent bg-muted/50 p-3 text-left transition-all hover:border-primary/20 hover:bg-card hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <div className="relative">
                                            <UserAvatar user={player} />
                                            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/0 transition-colors group-hover:bg-primary/10">
                                                <Plus className="size-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                                            </div>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="truncate font-semibold">{player.name}</div>
                                            {lbUser && (
                                                <div className="text-xs text-muted-foreground">{lbUser.mmr} MMR</div>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </AnimatePresence>
                        {outPlayers.length === 0 && (
                            <div className="rounded-xl border border-dashed border-muted-foreground/20 py-8 text-center text-sm text-muted-foreground">
                                All players selected
                            </div>
                        )}
                    </div>
                </div>

                {/* Playing */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-display text-lg uppercase tracking-wider text-primary">Playing</h3>
                        <span
                            className={cn(
                                'rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors',
                                isFull ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {selectedPlayers.length}/4
                        </span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <AnimatePresence mode="popLayout">
                            {inPlayers.map((player, index) => (
                                <motion.button
                                    key={player.id}
                                    layout
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
                                    onClick={() => setSelectedPlayers((prev) => prev.filter((id) => id !== player.id))}
                                    className="group flex items-center gap-3 rounded-xl border border-primary/20 bg-card p-3 text-left shadow-xs transition-all hover:border-destructive/30 hover:shadow-sm"
                                >
                                    <div className="relative">
                                        <UserAvatar user={player} />
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-destructive/0 transition-colors group-hover:bg-destructive/10">
                                            <X className="size-4 text-destructive opacity-0 transition-opacity group-hover:opacity-100" />
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-semibold">{player.name}</div>
                                        <div className="text-xs text-muted-foreground">{player.mmr} MMR</div>
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                        {Array.from({ length: Math.max(0, 4 - selectedPlayers.length) }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="flex items-center gap-3 rounded-xl border border-dashed border-muted-foreground/15 p-3"
                            >
                                <div className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/20">
                                    <span className="text-xs text-muted-foreground">?</span>
                                </div>
                                <span className="text-sm text-muted-foreground/50">Select a player</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

type LeaguePageProps = PageProps & {
    can: {
        deleteGames: boolean;
    };
    league: Resource<League>;
    leaderboard: Leaderboard;
    teamStats: TeamStats[];
    stats: {
        biggestWinStreak: {
            user: Resource<User>;
            winStreak: number;
        };
        biggestLoseStreak: {
            user: Resource<User>;
            loseStreak: number;
        };
        lastWeek: {
            mvp: {
                user: Resource<User>;
                winRate: number;
            };
            biggestL: {
                team: Resource<Team>;
                game: Resource<Game>;
                scoreDifference: number;
            };
            mostImproved?: {
                user: Resource<User>;
                improvement: number;
            };
        } | null;
    };
};

function lastNWeeks(n: number) {
    const startOfThisWeek = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weeks = [startOfThisWeek];
    for (let i = 1; i < n; i++) {
        weeks.push(subWeeks(weeks[weeks.length - 1], 1));
    }
    return weeks.reverse();
}

const LeaguePage: FC<LeaguePageProps> = ({ league: { data: league }, leaderboard, teamStats, stats, can }) => {
    const gamesByWeek = lastNWeeks(6).map((week, index, weeks) => ({
        week: format(week, 'dd MMM'),
        count: league.games.filter((game) =>
            isWithinInterval(game.createdAt, {
                start: week,
                end: index === weeks.length - 1 ? new Date() : weeks[index + 1],
            }),
        ).length,
    }));

    return (
        <Layout
            breadcrumbs={[
                { title: 'Leagues', href: route('dashboard') },
                {
                    title: league.name,
                    href: route('web.leagues.show', { league: league.id }),
                },
            ]}
        >
            <Head title={league.name} />
            <PageContainer>
                <SectionHeading className={'flex w-full flex-col justify-between gap-2 md:flex-row'}>
                    {league.name}
                    <div>
                        <CopyLeagueJoinLink league={league} />
                    </div>
                </SectionHeading>
                <Tabs defaultValue={'home'}>
                    <TabsList>
                        <TabsTrigger value="home">Home</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="teams">Teams</TabsTrigger>
                    </TabsList>
                    <TabsContent value={'home'} className={'space-y-8'}>
                        <div className={'grid gap-8 lg:grid-cols-3'}>
                            <NewGameSection league={league} leaderboard={leaderboard} />
                        </div>
                        <div className={'grid gap-8 lg:grid-cols-3'}>
                            <div>
                                <Statistic label={'Total players'} value={league.players.length} />
                            </div>
                            <div>
                                <Statistic label={'Total games'} value={league.games.length} />
                            </div>
                        </div>
                        <div className={'grid gap-8 lg:grid-cols-2'}>
                            <Statistic
                                label={'🥇 Biggest Win Streak 🥇'}
                                value={<UserCard user={stats.biggestWinStreak.user.data} />}
                                extra={`${stats.biggestWinStreak.winStreak} games`}
                            />
                            <Statistic
                                label={'🫠 Biggest Lose Streak 🫠'}
                                value={<UserCard user={stats.biggestLoseStreak.user.data} />}
                                extra={`${stats.biggestLoseStreak.loseStreak} games`}
                            />
                        </div>
                        {stats.lastWeek !== null ? <LastWeekStats lastWeek={stats.lastWeek} /> : null}
                        <PageSection title={'Games by week'} className={'lg:col-span-2'}>
                            <GamesByWeek gamesByWeek={gamesByWeek} />
                        </PageSection>
                        <PageSection
                            title={
                                <div className="flex items-center gap-2">
                                    Leaderboard
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                    <HelpCircle className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent className="max-w-sm">
                                                <div className="space-y-2 text-xs">
                                                    <p className="font-semibold">MMR (Match Making Rating) Algorithm:</p>
                                                    <ul className="list-bullet space-y-1 text-left">
                                                        <li>
                                                            <strong>Base:</strong> Elo rating system starting at 1000
                                                        </li>
                                                        <li>
                                                            <strong>New players:</strong> Start at 0 MMR until first game
                                                        </li>
                                                        <li>
                                                            <strong>Score difference:</strong> Bigger wins = more MMR
                                                        </li>
                                                        <li>
                                                            <strong>Skill gaps:</strong> Beating stronger teams = bonus MMR
                                                        </li>
                                                        <li>
                                                            <strong>Win streaks:</strong> 2+ wins = 10-40% MMR bonus
                                                        </li>
                                                        <li>
                                                            <strong>Lose streaks:</strong> 2+ losses = 10-40% MMR penalty
                                                        </li>
                                                        <li>
                                                            <strong>K-factor:</strong> Controls MMR change rate - higher for new/volatile players,
                                                            lower for experienced players
                                                        </li>
                                                    </ul>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            }
                        >
                            <LeaderboardTable leaderboard={leaderboard} />
                        </PageSection>
                    </TabsContent>
                    <TabsContent value={'history'}>
                        <RecentGames league={league} canDeleteGames={can.deleteGames} />
                    </TabsContent>
                    <TabsContent value={'teams'}>
                        <PageSection title={'Team stats'}>
                            <TeamStats stats={teamStats} />
                        </PageSection>
                    </TabsContent>
                </Tabs>
            </PageContainer>
        </Layout>
    );
};

export default LeaguePage;

const LastWeekStats: FC<{ lastWeek: NonNullable<LeaguePageProps['stats']['lastWeek']> }> = ({ lastWeek }) => {
    return (
        <>
            <SectionHeading>Last week</SectionHeading>
            <div className={'grid gap-8 lg:row-span-2 lg:grid-cols-3'}>
                <Statistic
                    label={'🔥 MVP 🔥'}
                    value={<UserCard user={lastWeek.mvp.user.data} />}
                    extra={`${new Intl.NumberFormat('en-GB', {
                        style: 'percent',
                    }).format(lastWeek.mvp.winRate)} win rate last week`}
                />
                <Statistic
                    label={'🤡 Biggest L 🤡'}
                    value={
                        <div>
                            <UserCard user={lastWeek.biggestL.team.data.players[0]} />
                            <UserCard user={lastWeek.biggestL.team.data.players[1]} />
                        </div>
                    }
                    extra={(() => {
                        const nonLosingTeams = lastWeek.biggestL.game.data.teams.filter((t) => t.id !== lastWeek.biggestL.team.data.id);

                        const nonLosingPlayers = nonLosingTeams
                            .flatMap((t) => t.players)
                            .map((p) => p.name)
                            .join(' & ');

                        return (
                            <div>
                                Lost {nonLosingTeams[0].score} - {lastWeek.biggestL.team.data.score} to {nonLosingPlayers}
                            </div>
                        );
                    })()}
                />
                {lastWeek.mostImproved && (
                    <Statistic
                        label={'📈 Most improved 📈'}
                        value={<UserCard user={lastWeek.mostImproved.user.data} />}
                        extra={`Win rate went up ${new Intl.NumberFormat('en-GB', {
                            style: 'percent',
                        }).format(lastWeek.mostImproved.improvement)}`}
                    />
                )}
            </div>
        </>
    );
};

function GamesByWeek({ gamesByWeek }: { gamesByWeek: { week: string; count: number }[] }) {
    return (
        <ChartContainer
            config={{
                count: {
                    label: 'W/C',
                    color: 'var(--chart-1)',
                },
            }}
            className="max-h-[300px] min-h-[200px] w-full"
        >
            <BarChart accessibilityLayer data={gamesByWeek}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="week"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                // tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent payload={undefined} />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}

function NewGameSection({ league, leaderboard }: { league: League; leaderboard: Leaderboard }) {
    const [activeTab, setActiveTab] = useState('generator');
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
    const [generatedTeams, setGeneratedTeams] = useState<number[][]>([[], []]);
    const [teamGenerationKey, setTeamGenerationKey] = useState(0);

    const handleTeamsGenerated = (newTeams: number[][]) => {
        setGeneratedTeams(newTeams);
        setTeamGenerationKey((prev) => prev + 1);
    };

    const handleSwitchToForm = () => {
        setActiveTab('form');
    };

    return (
        <PageSection title={'New Game'} className={'col-span-3'}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="generator">Pick Teams</TabsTrigger>
                    <TabsTrigger value="form">Record Game</TabsTrigger>
                </TabsList>
                <TabsContent value="generator" className="mt-6">
                    <GameGenerator
                        leaderboard={leaderboard}
                        players={league.players}
                        selectedPlayers={selectedPlayers}
                        setSelectedPlayers={setSelectedPlayers}
                        generatedTeams={generatedTeams}
                        teamGenerationKey={teamGenerationKey}
                        onTeamsGenerated={handleTeamsGenerated}
                        onSwitchToForm={handleSwitchToForm}
                    />
                </TabsContent>
                <TabsContent value="form" className="mt-6">
                    <NewGameForm teams={generatedTeams ?? []} onTeamsChange={(newTeams) => handleTeamsGenerated(newTeams)} league={league} />
                </TabsContent>
            </Tabs>
        </PageSection>
    );
}
