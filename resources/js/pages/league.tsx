import { Button } from '@/components/ui/button';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import { Statistic } from '@/components/ui/statistic';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormError } from '@/components/ui/formError';
import { FormField } from '@/components/ui/formField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { HeadToHead, Leaderboard, LeaderboardTable, LeaderboardUser, PlayerTeammateStats } from '@/features/leaderboard/leaderboard-table';
import { NewGameForm } from '@/features/new-game/newGameForm';
import { RecentGames } from '@/features/recent-games/recent-games';
import { TeamStats } from '@/features/team-stats/team-stats';
import { UserAvatar, UserCard } from '@/features/users/user-card';
import Layout from '@/layouts/app-layout';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { shuffleArray } from '@/lib/shuffle-array';
import { Game, League, PageProps, Resource, Season, Team, User } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { format, isWithinInterval, startOfWeek, subWeeks } from 'date-fns';
import { Check, ChevronDown, HelpCircle, Plus, Scale, Shuffle, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Dispatch, FC, SetStateAction, useRef, useState } from 'react';
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

const SeasonBadge: FC<{
    league: League;
    currentSeason: Resource<Season> | null;
    canStartSeason: boolean;
}> = ({ league, currentSeason, canStartSeason }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const form = useForm({
        custom_name: '',
    });

    const handleStartSeason = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(route('api.seasons.store', { league: league.id }), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setDialogOpen(false);
            },
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            {currentSeason && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                    <span className="size-2 rounded-full bg-primary animate-pulse" />
                    {currentSeason.data.displayName}
                </span>
            )}
            {canStartSeason && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="gap-1.5">
                            <Plus className="size-3.5" />
                            New Season
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Start New Season</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">
                            This will end the current season and start a new one. All new games will be recorded under the new season.
                        </p>
                        <form onSubmit={handleStartSeason} className="space-y-4">
                            <FormField>
                                <Label htmlFor="custom_name">Season Name (optional)</Label>
                                <Input
                                    value={form.data.custom_name}
                                    onChange={(e) => form.setData('custom_name', e.target.value)}
                                    name="custom_name"
                                    placeholder={`Season ${(league.seasons?.length ?? 0) + 1}`}
                                />
                                <FormError>{form.errors.custom_name}</FormError>
                            </FormField>
                            <Button type="submit" disabled={form.processing}>
                                Start Season
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
};

const SeasonSelector: FC<{
    league: League;
    selectedSeasonId: string;
    activeTab: string;
}> = ({ league, selectedSeasonId, activeTab }) => {
    const handleSeasonChange = (value: string) => {
        const url = route('web.leagues.show', { league: league.id });
        router.visit(`${url}?season=${value}&tab=${activeTab}`, { preserveScroll: true });
    };

    const sortedSeasons = [...(league.seasons ?? [])].sort((a, b) => b.number - a.number);

    return (
        <Select value={selectedSeasonId} onValueChange={handleSeasonChange}>
            <SelectTrigger className="w-[180px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {sortedSeasons.map((season) => (
                    <SelectItem key={season.id} value={String(season.id)}>
                        {season.displayName}
                    </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
        </Select>
    );
};

const GameGenerator: FC<{
    leaderboard: LeaderboardUser[];
    players: User[];
    selectedPlayers: number[];
    setSelectedPlayers: Dispatch<SetStateAction<number[]>>;
    onTeamsGenerated?: (teams: number[][]) => void;
}> = ({ leaderboard, players, selectedPlayers, setSelectedPlayers, onTeamsGenerated }) => {
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
            if (sumA < sumB || (sumA === sumB && teamA.length <= teamB.length)) {
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

    const outPlayers = players.filter((p) => !selectedPlayers.includes(p.id));
    const inPlayers = selectedPlayers
        .map((id) => leaderboard.find((u) => u.id === id))
        .filter((u): u is LeaderboardUser => !!u);
    const isFull = selectedPlayers.length >= 4;

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
        startSeason: boolean;
    };
    league: Resource<League>;
    currentSeason: Resource<Season> | null;
    selectedSeasonId: string;
    leaderboard: Leaderboard;
    headToHead: HeadToHead;
    playerTeammateStats: PlayerTeammateStats;
    teamStats: TeamStats[];
    stats: {
        currentWinStreak: {
            user: Resource<User>;
            winStreak: number;
        } | null;
        currentLoseStreak: {
            user: Resource<User>;
            loseStreak: number;
        } | null;
        lastWeek: {
            mvp: {
                user: Resource<User>;
                winRate: number;
            } | null;
            biggestL: {
                team: Resource<Team>;
                game: Resource<Game>;
                scoreDifference: number;
            } | null;
            mostImproved: {
                user: Resource<User>;
                improvement: number;
            } | null;
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

const VALID_TABS = ['new-game', 'stats', 'history', 'teams'];

const LeaguePage: FC<LeaguePageProps> = ({ league: { data: league }, currentSeason, selectedSeasonId, leaderboard, headToHead, playerTeammateStats, teamStats, stats, can }) => {
    const initialTab = (() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        return tab && VALID_TABS.includes(tab) ? tab : 'new-game';
    })();
    const [activeTab, setActiveTab] = useState(initialTab);

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        const params = new URLSearchParams(window.location.search);
        params.set('tab', value);
        window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
    };

    const selectedSeason = league.seasons?.find((s) => String(s.id) === selectedSeasonId);
    const seasonLabel = selectedSeasonId === 'all' ? 'All Time' : (selectedSeason?.displayName ?? 'All Time');

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
                    <div className="flex items-center gap-3">
                        <SeasonBadge
                            league={league}
                            currentSeason={currentSeason}
                            canStartSeason={can.startSeason}
                        />
                        <CopyLeagueJoinLink league={league} />
                    </div>
                </SectionHeading>
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <TabsList>
                            <TabsTrigger value="new-game">New Game</TabsTrigger>
                            <TabsTrigger value="stats">Stats</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                            <TabsTrigger value="teams">Teams</TabsTrigger>
                        </TabsList>
                        {activeTab !== 'new-game' && (
                            <SeasonSelector league={league} selectedSeasonId={selectedSeasonId} activeTab={activeTab} />
                        )}
                    </div>
                    <TabsContent value={'new-game'} className={'space-y-8'}>
                        <div className={'grid gap-8 lg:grid-cols-3'}>
                            <NewGameSection league={league} leaderboard={leaderboard} />
                        </div>
                    </TabsContent>
                    <TabsContent value={'stats'} className={'space-y-8'}>
                        <div className={'grid gap-8 lg:grid-cols-3'}>
                            <div>
                                <Statistic label={'Total players'} value={league.players.length} />
                            </div>
                            <div>
                                <Statistic label={'Total games'} value={league.games.length} />
                            </div>
                        </div>
                        {(stats.currentWinStreak || stats.currentLoseStreak) && (
                            <div className={'grid gap-8 lg:grid-cols-2'}>
                                {stats.currentWinStreak && (
                                    <Statistic
                                        label={'🥇 Current Win Streak 🥇'}
                                        value={<UserCard user={stats.currentWinStreak.user.data} />}
                                        extra={`${stats.currentWinStreak.winStreak} games`}
                                    />
                                )}
                                {stats.currentLoseStreak && (
                                    <Statistic
                                        label={'🫠 Current Lose Streak 🫠'}
                                        value={<UserCard user={stats.currentLoseStreak.user.data} />}
                                        extra={`${stats.currentLoseStreak.loseStreak} games`}
                                    />
                                )}
                            </div>
                        )}
                        {stats.lastWeek !== null ? <LastWeekStats lastWeek={stats.lastWeek} /> : null}
                        <PageSection title={'Games by week'} className={'lg:col-span-2'}>
                            <GamesByWeek gamesByWeek={gamesByWeek} />
                        </PageSection>
                        <PageSection
                            title={
                                <div className="flex items-center gap-2">
                                    Leaderboard ({seasonLabel})
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
                            <LeaderboardTable leaderboard={leaderboard} headToHead={headToHead} playerTeammateStats={playerTeammateStats} />
                        </PageSection>
                    </TabsContent>
                    <TabsContent value={'history'}>
                        <RecentGames league={league} canDeleteGames={can.deleteGames} />
                    </TabsContent>
                    <TabsContent value={'teams'}>
                        <TeamStats stats={teamStats} />
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
                {lastWeek.mvp && (
                    <Statistic
                        label={'🔥 MVP 🔥'}
                        value={<UserCard user={lastWeek.mvp.user.data} />}
                        extra={`${new Intl.NumberFormat('en-GB', {
                            style: 'percent',
                        }).format(lastWeek.mvp.winRate)} win rate last week`}
                    />
                )}
                {lastWeek.biggestL && (
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
                )}
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

type UserId = User["id"]

function NewGameSection({ league, leaderboard }: { league: League; leaderboard: Leaderboard }) {
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [selectedPlayers, setSelectedPlayers] = useState<UserId[]>([]);
    const [generatedTeams, setGeneratedTeams] = useState<UserId[][]>([[], []]);
    const formRef = useRef<HTMLDivElement>(null);

    const handleTeamsGenerated = (newTeams: UserId[][]) => {
        setGeneratedTeams(newTeams);
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className={'col-span-3 space-y-6'}>
            <div ref={formRef}>
                <NewGameForm teams={generatedTeams ?? []} onTeamsChange={handleTeamsGenerated} league={league} />
            </div>

            <Collapsible open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                <Users className="size-5 text-primary" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-display text-lg uppercase tracking-wider">Generate Teams</h3>
                                <p className="text-sm text-muted-foreground">Optional — split players into balanced teams</p>
                            </div>
                        </div>
                        <ChevronDown className={cn('size-5 text-muted-foreground transition-transform duration-200', isGeneratorOpen && 'rotate-180')} />
                    </button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <div className="mt-4">
                        <GameGenerator
                            leaderboard={leaderboard}
                            players={league.players}
                            selectedPlayers={selectedPlayers}
                            setSelectedPlayers={setSelectedPlayers}
                            onTeamsGenerated={handleTeamsGenerated}
                        />
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
}
