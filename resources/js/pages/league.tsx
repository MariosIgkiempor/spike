import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormError } from '@/components/ui/formError';
import { FormField } from '@/components/ui/formField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Statistic } from '@/components/ui/statistic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HeadToHead, Leaderboard, LeaderboardTable, LeaderboardUser, PlayerTeammateStats } from '@/features/leaderboard/leaderboard-table';
import { NewGameForm } from '@/features/new-game/newGameForm';
import { RecentGames } from '@/features/recent-games/recent-games';
import { TeamStats } from '@/features/team-stats/team-stats';
import { UserAvatar, UserCard } from '@/features/users/user-card';
import Layout from '@/layouts/app-layout';
import { generateFairTeamsFromPool, generateRandomTeamsFromPool } from '@/lib/team-generator';
import { cn } from '@/lib/utils';
import { Game, League, PageProps, Resource, Season, Team, User } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { format, isWithinInterval, startOfWeek, subWeeks } from 'date-fns';
import { Check, ChevronDown, HelpCircle, Plus, Scale, Shuffle, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Dispatch, FC, SetStateAction, useMemo, useRef, useState } from 'react';
import { Line, LineChart, XAxis } from 'recharts';
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
                    <span className="size-2 animate-pulse rounded-full bg-primary" />
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
        const selectedUsers = selectedPlayers.map((id) => leaderboard.find((u) => u.id === id)).filter((u): u is LeaderboardUser => !!u);
        const [teamA, teamB] = generateFairTeamsFromPool(selectedUsers);
        onTeamsGenerated?.([teamA, teamB]);
    };

    const generateRandomTeams = () => {
        const selectedUsers = selectedPlayers.map((id) => leaderboard.find((u) => u.id === id)).filter((u): u is LeaderboardUser => !!u);
        const [teamA, teamB] = generateRandomTeamsFromPool(selectedUsers);
        onTeamsGenerated?.([teamA, teamB]);
    };

    const [searchQuery, setSearchQuery] = useState('');

    const outPlayers = players
        .filter((p) => !selectedPlayers.includes(p.id))
        .filter((p) => searchQuery.length === 0 || p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const inPlayers = selectedPlayers.map((id) => leaderboard.find((u) => u.id === id)).filter((u): u is LeaderboardUser => !!u);
    const isReady = selectedPlayers.length >= 4;

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
                <div className="space-y-4 p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div
                                    className={cn(
                                        'flex size-12 items-center justify-center rounded-xl transition-colors duration-300',
                                        isReady ? 'bg-primary/15' : 'bg-muted',
                                    )}
                                >
                                    <Users
                                        className={cn('size-6 transition-colors duration-300', isReady ? 'text-primary' : 'text-muted-foreground')}
                                    />
                                </div>
                                {isReady && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                                    >
                                        <Check className="size-3" />
                                    </motion.div>
                                )}
                            </div>
                            <h3 className="font-display text-xl tracking-wider uppercase">
                                {isReady
                                    ? selectedPlayers.length === 4
                                        ? 'Ready to Draft'
                                        : `${selectedPlayers.length} Selected`
                                    : `Pick ${4 - selectedPlayers.length} More`}
                            </h3>
                        </div>
                        <div className="flex gap-3">
                            <Button onClick={generateFairTeams} disabled={!isReady} size="lg" className="gap-2">
                                <Scale className="size-4" />
                                Fair Teams
                            </Button>
                            <Button onClick={generateRandomTeams} disabled={!isReady} variant="secondary" size="lg" className="gap-2">
                                <Shuffle className="size-4" />
                                Random
                            </Button>
                        </div>
                    </div>

                    {/* Avatar Lineup */}
                    <div className="flex flex-wrap items-start gap-4">
                        <AnimatePresence mode="popLayout">
                            {inPlayers.map((player) => (
                                <motion.button
                                    key={player.id}
                                    layout
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                                    onClick={() => setSelectedPlayers((prev) => prev.filter((id) => id !== player.id))}
                                    className="group flex flex-col items-center gap-1"
                                >
                                    <div className="relative">
                                        <UserAvatar
                                            user={player}
                                            size="xl"
                                            className="ring-2 ring-primary/30 transition-shadow group-hover:ring-destructive/40"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-destructive/0 transition-colors group-hover:bg-destructive/60">
                                            <X className="size-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <div className="max-w-16 truncate text-sm font-semibold">{player.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{player.mmr} MMR</div>
                                    </div>
                                </motion.button>
                            ))}
                        </AnimatePresence>
                        {Array.from({ length: Math.max(0, 4 - selectedPlayers.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="flex flex-col items-center gap-1">
                                <div
                                    className={cn(
                                        'flex size-11 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/20',
                                        i === 0 && 'animate-pulse',
                                    )}
                                >
                                    <span className="text-sm text-muted-foreground">?</span>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm text-muted-foreground/40">&nbsp;</div>
                                    <div className="text-[10px] text-muted-foreground/0">&nbsp;</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Available Players */}
            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <h3 className="font-display text-lg tracking-wider text-muted-foreground uppercase">Available</h3>
                    <Input
                        type="search"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 max-w-48"
                    />
                    <span className="ml-auto text-sm font-medium text-muted-foreground">{outPlayers.length}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <AnimatePresence>
                        {outPlayers.map((player) => {
                            const lbUser = leaderboard.find((u) => u.id === player.id);
                            return (
                                <motion.button
                                    key={player.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={() => setSelectedPlayers((prev) => [...prev, player.id])}
                                    className="group flex items-center gap-3 rounded-xl border border-transparent bg-muted/50 p-3 text-left transition-all hover:border-primary/20 hover:bg-card hover:shadow-sm"
                                >
                                    <div className="relative">
                                        <UserAvatar user={player} />
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/0 transition-colors group-hover:bg-primary/10">
                                            <Plus className="size-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate font-semibold">{player.name}</div>
                                        {lbUser && <div className="text-sm text-muted-foreground">{lbUser.mmr} MMR</div>}
                                    </div>
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                    {outPlayers.length === 0 && (
                        <div className="col-span-full rounded-xl border border-dashed border-muted-foreground/20 py-8 text-center text-sm text-muted-foreground">
                            {searchQuery.length > 0 ? 'No players found' : 'All players selected'}
                        </div>
                    )}
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

const LeaguePage: FC<LeaguePageProps> = ({
    league: { data: league },
    currentSeason,
    selectedSeasonId,
    leaderboard,
    headToHead,
    playerTeammateStats,
    teamStats,
    stats,
    can,
}) => {
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

    const closestRivalry = useMemo(() => {
        let best: { playerA: LeaderboardUser; playerB: LeaderboardUser; wins: number; losses: number; balance: number } | null = null;
        const seen = new Set<string>();
        for (const aId of Object.keys(headToHead)) {
            for (const bId of Object.keys(headToHead[Number(aId)] ?? {})) {
                const key = [aId, bId].sort().join('-');
                if (seen.has(key) || aId === bId) continue;
                seen.add(key);
                const record = headToHead[Number(aId)][Number(bId)];
                const total = record.wins + record.losses;
                if (total < 3) continue;
                const balance = Math.min(record.wins, record.losses) / Math.max(record.wins, record.losses);
                if (!best || balance > best.balance || (balance === best.balance && total > best.wins + best.losses)) {
                    const playerA = leaderboard.find((u) => u.id === Number(aId));
                    const playerB = leaderboard.find((u) => u.id === Number(bId));
                    if (playerA && playerB) {
                        best = { playerA, playerB, wins: record.wins, losses: record.losses, balance };
                    }
                }
            }
        }
        return best;
    }, [headToHead, leaderboard]);

    const mostVolatilePlayer = useMemo(() => {
        let best: { player: LeaderboardUser; avgSwing: number } | null = null;
        for (const player of leaderboard) {
            const history = player.mmr_history;
            if (history.length < 5) continue;
            const deltas = history.slice(1).map((h, i) => Math.abs(h.mmr - history[i].mmr));
            const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
            if (!best || avg > best.avgSwing) {
                best = { player, avgSwing: Math.round(avg) };
            }
        }
        return best;
    }, [leaderboard]);

    const bestDuo = useMemo(() => {
        let best: { playerA: LeaderboardUser; playerB: LeaderboardUser; games: number; wins: number; winRate: number } | null = null;
        const seen = new Set<string>();
        for (const aId of Object.keys(playerTeammateStats)) {
            for (const bId of Object.keys(playerTeammateStats[Number(aId)] ?? {})) {
                const key = [aId, bId].sort().join('-');
                if (seen.has(key) || aId === bId) continue;
                seen.add(key);
                const record = playerTeammateStats[Number(aId)][Number(bId)];
                if (record.games < 3) continue;
                const winRate = record.wins / record.games;
                if (!best || winRate > best.winRate || (winRate === best.winRate && record.games > best.games)) {
                    const playerA = leaderboard.find((u) => u.id === Number(aId));
                    const playerB = leaderboard.find((u) => u.id === Number(bId));
                    if (playerA && playerB) {
                        best = { playerA, playerB, games: record.games, wins: record.wins, winRate };
                    }
                }
            }
        }
        return best;
    }, [playerTeammateStats, leaderboard]);

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
                        <SeasonBadge league={league} currentSeason={currentSeason} canStartSeason={can.startSeason} />
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
                        {activeTab !== 'new-game' && <SeasonSelector league={league} selectedSeasonId={selectedSeasonId} activeTab={activeTab} />}
                    </div>
                    <TabsContent value={'new-game'} className={'space-y-8'}>
                        <div className={'grid gap-8 lg:grid-cols-3'}>
                            <NewGameSection league={league} leaderboard={leaderboard} />
                        </div>
                    </TabsContent>
                    <TabsContent value={'stats'} className={'space-y-8'}>
                        <div className={'grid grid-cols-2 gap-4 lg:grid-cols-4'}>
                            <Statistic label={'Total players'} value={league.players.length} />
                            <Statistic label={'Total games'} value={league.games.length} />
                            <div className="col-span-2">
                                <GamesTrendline gamesByWeek={gamesByWeek} />
                            </div>
                        </div>
                        {(stats.currentWinStreak || stats.currentLoseStreak) && (
                            <div className={'grid gap-4 lg:grid-cols-2'}>
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
                        {(closestRivalry || mostVolatilePlayer || bestDuo) && (
                            <div className={'grid gap-4 lg:grid-cols-3'}>
                                {closestRivalry && (
                                    <Statistic
                                        label={'Closest Rivalry'}
                                        value={
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <UserAvatar user={closestRivalry.playerA} />
                                                    <div className="truncate font-semibold">{closestRivalry.playerA.name}</div>
                                                </div>
                                                <span className="text-sm text-muted-foreground">vs</span>
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <UserAvatar user={closestRivalry.playerB} />
                                                    <div className="truncate font-semibold">{closestRivalry.playerB.name}</div>
                                                </div>
                                            </div>
                                        }
                                        extra={
                                            <span>
                                                {closestRivalry.wins}W - {closestRivalry.losses}L
                                            </span>
                                        }
                                    />
                                )}
                                {mostVolatilePlayer && (
                                    <Statistic
                                        label={'Most Volatile'}
                                        value={<UserCard user={mostVolatilePlayer.player} />}
                                        extra={`avg swing ±${mostVolatilePlayer.avgSwing} MMR`}
                                    />
                                )}
                                {bestDuo && (
                                    <Statistic
                                        label={'Best Duo'}
                                        value={
                                            <div className="flex flex-wrap items-center gap-2">
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <UserAvatar user={bestDuo.playerA} />
                                                    <div className="truncate font-semibold">{bestDuo.playerA.name}</div>
                                                </div>
                                                <span className="text-sm text-muted-foreground">&</span>
                                                <div className="flex min-w-0 items-center gap-2">
                                                    <UserAvatar user={bestDuo.playerB} />
                                                    <div className="truncate font-semibold">{bestDuo.playerB.name}</div>
                                                </div>
                                            </div>
                                        }
                                        extra={`${bestDuo.wins}W from ${bestDuo.games} games (${Math.round(bestDuo.winRate * 100)}%)`}
                                    />
                                )}
                            </div>
                        )}
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
                                                <div className="space-y-2 text-sm">
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

function GamesTrendline({ gamesByWeek }: { gamesByWeek: { week: string; count: number }[] }) {
    return (
        <Card className="relative h-full justify-between gap-2">
            <div className="h-1 rounded-t-xl bg-gradient-to-r from-primary to-accent" />
            <CardHeader>
                <CardTitle>Games / Week</CardTitle>
            </CardHeader>
            <CardContent className="pb-2">
                <ChartContainer
                    config={{
                        count: {
                            label: 'Games',
                            color: 'var(--chart-1)',
                        },
                    }}
                    className="h-[100px] w-full"
                >
                    <LineChart data={gamesByWeek} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                        <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} tickMargin={4} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                            type="monotone"
                            dataKey="count"
                            stroke="var(--color-count)"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 0, fill: 'var(--color-count)' }}
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

type UserId = User['id'];

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
                <NewGameForm teams={generatedTeams ?? []} onTeamsChange={handleTeamsGenerated} league={league} leaderboard={leaderboard} />
            </div>

            <Collapsible open={isGeneratorOpen} onOpenChange={setIsGeneratorOpen}>
                <CollapsibleTrigger asChild>
                    <button className="flex w-full items-center justify-between rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                                <Users className="size-5 text-primary" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-display text-lg tracking-wider uppercase">Generate Teams</h3>
                                <p className="text-sm text-muted-foreground">Optional — split players into balanced teams</p>
                            </div>
                        </div>
                        <ChevronDown
                            className={cn('size-5 text-muted-foreground transition-transform duration-200', isGeneratorOpen && 'rotate-180')}
                        />
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
