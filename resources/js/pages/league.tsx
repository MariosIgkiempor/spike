import { PlayerInput } from '@/components/PlayerInput';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Leaderboard, LeaderboardUser } from '@/features/leaderboard/leaderboard';
import { NewGameForm } from '@/features/new-game/newGameForm';
import { RecentGames } from '@/features/recent-games/recent-games';
import { TeamStats } from '@/features/team-stats/team-stats';
import Layout from '@/layouts/app-layout';
import { shuffleArray } from '@/lib/shuffle-array';
import { League, PageProps, Resource, ResourceCollection, User } from '@/types';
import { Head } from '@inertiajs/react';
import { Trash } from 'lucide-react';
import { FC, useState } from 'react';
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

const GameGenerator: FC<{ leaderboard: LeaderboardUser[]; players: User[] }> = ({ leaderboard, players }) => {
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

        setTeams([teamA, teamB]);
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

        setTeams([teamA, teamB]);
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
                <div className="mt-6 grid grid-cols-2 gap-4">
                    {[teams[0], teams[1]].map((team) => (
                        <div>
                            <h3 className="text-lg font-semibold">Team A (MMR: {teamMMR(team)})</h3>
                            <ul className="grid gap-4 md:grid-cols-2">
                                {team.map((id) => {
                                    const user = leaderboard.find((u) => u.id === id);
                                    return (
                                        <li key={id}>
                                            <Card className={'p-3'}>
                                                <CardHeader className={'p-3'}>
                                                    <CardTitle>{user?.name || id}</CardTitle>
                                                    <CardDescription>{user?.mmr}</CardDescription>
                                                </CardHeader>
                                            </Card>
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
    league: Resource<League>;
    leaderboard: LeaderboardUser[];
    players: ResourceCollection<User>;
    teamStats: TeamStats[];
};

const LeaguePage: FC<LeaguePageProps> = ({ league: { data: league }, players: { data: players }, leaderboard, teamStats }) => {
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
            <Head title="league" />
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
                    <TabsContent value={'home'}>
                        <PageSection title={'Record new game'}>
                            <NewGameForm league={league} players={players} />
                        </PageSection>
                        <PageSection title={'Pick teams'}>
                            <GameGenerator leaderboard={leaderboard} players={players} />
                        </PageSection>
                        <PageSection title={'Leaderboard'}>
                            <Leaderboard leaderboard={leaderboard} />
                        </PageSection>
                    </TabsContent>
                    <TabsContent value={'history'}>
                        <RecentGames league={league} />
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
