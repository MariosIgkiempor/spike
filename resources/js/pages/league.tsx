import { PlayerInput } from '@/components/PlayerInput';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import { Statistic } from '@/components/ui/statistic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaderboard, LeaderboardTable, LeaderboardUser } from '@/features/leaderboard/leaderboard-table';
import { NewGameForm } from '@/features/new-game/newGameForm';
import { RecentGames } from '@/features/recent-games/recent-games';
import { TeamStats } from '@/features/team-stats/team-stats';
import { UserCard } from '@/features/users/user-card';
import Layout from '@/layouts/app-layout';
import { shuffleArray } from '@/lib/shuffle-array';
import { Game, League, PageProps, Resource, Team, User } from '@/types';
import { Head } from '@inertiajs/react';
import { format, isWithinInterval, startOfWeek, subWeeks } from 'date-fns';
import { Trash } from 'lucide-react';
import { FC, useState } from 'react';
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
    onTeamsGenerated?: (teams: number[][]) => void;
}> = ({ leaderboard, players, onTeamsGenerated }) => {
    const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
    const [teams, setTeams] = useState<number[][]>([]);

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
        setTeams(teams);
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
        setTeams(teams);
        onTeamsGenerated?.(teams);
    };

    const teamMMR = (team: number[]) => {
        const players = team
            .map((playerId) => leaderboard.find((u) => u.id === playerId))
            .filter((u) => u !== undefined)
            .map((u) => u.mmr);
        return players.reduce((a, b) => a + b, 0);
    };

    const handleRemovePlayer = (playerId: number) => {
        const newList = selectedPlayers.filter((p) => p !== playerId);

        setSelectedPlayers(newList);
    };

    return (
        <>
            <PlayerInput
                onChange={(playerId) => setSelectedPlayers((prev) => (playerId ? [...prev, playerId] : prev))}
                label="Player"
                value={null}
                players={players.filter((p) => !selectedPlayers.includes(p.id))}
            />

            <div className={'flex flex-col gap-4'}>
                {selectedPlayers.map((playerId) => {
                    const player = leaderboard.find((u) => u.id === playerId);
                    return (
                        <div className={'flex justify-between gap-2'}>
                            <div>
                                <h3 className={'font-semibold'}>{player?.name || playerId}</h3>
                                <div className={'text-sm text-muted-foreground'}>
                                    MMR <span className={'font-semibold'}>{player?.mmr}</span>
                                </div>
                            </div>
                            <Button variant={'destructive'} size={'icon'} onClick={() => handleRemovePlayer(playerId)}>
                                <Trash />
                            </Button>
                        </div>
                    );
                })}
            </div>

            <div className={'flex flex-wrap gap-4'}>
                <Button onClick={generateFairTeams} disabled={selectedPlayers.length < 2}>
                    Fair Teams
                </Button>

                <Button onClick={generateRandomTeams} disabled={selectedPlayers.length < 2}>
                    Random Teams
                </Button>
            </div>

            {teams.length === 2 && (
                <div className="mt-6 grid gap-4">
                    {[teams[0], teams[1]].map((team) => (
                        <div>
                            <h3 className="text-lg font-semibold">Team A (MMR: {teamMMR(team)})</h3>
                            <ul className="grid gap-4 md:grid-cols-2">
                                {team.map((id) => {
                                    const user = leaderboard.find((u) => u.id === id)!;
                                    return (
                                        <li key={id}>
                                            <UserCard user={user} />
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </>
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
                        <PageSection title={'Leaderboard'}>
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
                    color: 'var(--chart-3)',
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
                <Bar dataKey="count" fill="var(--color-played)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}

function NewGameSection({ league, leaderboard }: { league: League; leaderboard: Leaderboard }) {
    const [teams, setTeams] = useState<number[][] | undefined>(undefined);

    return (
        <>
            <PageSection title={'Pick teams'}>
                <GameGenerator leaderboard={leaderboard} players={league.players} onTeamsGenerated={(teams) => setTeams(teams)} />
            </PageSection>
            <PageSection title={'Record new game'} className={'col-span-2'}>
                <NewGameForm teams={teams ?? []} onTeamsChange={(newTeams) => setTeams(newTeams)} league={league} />
            </PageSection>
        </>
    );
}
