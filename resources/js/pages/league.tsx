import { PlayerInput } from '@/components/PlayerInput';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import { Leaderboard, LeaderboardUser } from '@/features/leaderboard/leaderboard';
import { NewGameForm } from '@/features/new-game/newGameForm';
import { RecentGames } from '@/features/recent-games/recent-games';
import Layout from '@/layouts/app-layout';
import { League, PageProps, Resource } from '@/types';
import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { FC, useState } from 'react';
import { toast } from 'sonner';

const fetchLeaderboard = async (leagueId: number) => {
    const response = await fetch(route('api.leaderboard.show', { league: leagueId }), {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });

    if (!response.ok) {
        throw new Error('Could not fetch leaderboard');
    }

    const json = await response.json();
    return json as LeaderboardUser[];
};

const LeaguePlayers: FC<{ league: League }> = ({ league }) => {
    const { data: leaderboard, isLoading } = useQuery<LeaderboardUser[]>({
        queryKey: ['leaderboard', league.id],
        queryFn: () => fetchLeaderboard(league.id),
    });

    return (
        <>
            <PageSection>
                <SectionHeading>Pick fair teams</SectionHeading>
                {leaderboard === undefined ? null : <GameGenerator leaderboard={leaderboard} league={league} />}
            </PageSection>
            <PageSection>{leaderboard === undefined ? null : <Leaderboard leaderboard={leaderboard} isLoading={isLoading} />}</PageSection>
        </>
    );
};

type LeaguePageProps = PageProps & {
    league: Resource<League>;
};

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

const GameGenerator: FC<{ leaderboard: LeaderboardUser[]; league: League }> = ({ leaderboard, league }) => {
    const [players, setPlayers] = useState<number[]>([]);
    const [teams, setTeams] = useState<number[][]>([]);

    const generateTeams = () => {
        // Map selected IDs to full user objects with MMR
        const selectedUsers = players.map((id) => leaderboard.find((u) => u.id === id)).filter((u): u is LeaderboardUser => !!u);

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

    const teamMMR = (team: number[]) => {
        const players = team
            .map((playerId) => leaderboard.find((u) => u.id === playerId))
            .filter((u) => u !== undefined)
            .map((u) => u.mmr);
        return players.reduce((a, b) => a + b, 0);
    };

    return (
        <>
            <PlayerInput
                onChange={(playerId) => setPlayers((prev) => (playerId ? [...prev, playerId] : prev))}
                label="Player"
                value={null}
                leagueId={league.id}
            />

            <div className={'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
                {players.map((playerId) => {
                    const player = leaderboard.find((u) => u.id === playerId);
                    return (
                        <Card key={playerId} className="mt-2">
                            <CardHeader>
                                <CardTitle>{player?.name || playerId}</CardTitle>
                                <CardDescription>{player?.mmr}</CardDescription>
                            </CardHeader>
                        </Card>
                    );
                })}
            </div>

            <Button onClick={generateTeams} className="mt-4" disabled={players.length < 2}>
                Generate Teams
            </Button>

            {teams.length === 2 && (
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                        <h3 className="text-lg font-semibold">Team A (MMR: {teamMMR(teams[0])})</h3>
                        <ul className="list-disc pl-5">
                            {teams[0].map((id) => {
                                const user = leaderboard.find((u) => u.id === id);
                                return <li key={id}>{user?.name || id}</li>;
                            })}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Team B (MMR: {teamMMR(teams[1])})</h3>
                        <ul className="list-disc pl-5">
                            {teams[1].map((id) => {
                                const user = leaderboard.find((u) => u.id === id);
                                return <li key={id}>{user?.name || id}</li>;
                            })}
                        </ul>
                    </div>
                </div>
            )}
        </>
    );
};

const LeaguePage: FC<LeaguePageProps> = ({ league: { data: league } }) => {
    return (
        <Layout>
            <Head title="league" />
            <PageContainer>
                <SectionHeading className={'flex w-full flex-col justify-between gap-2 md:flex-row'}>
                    {league.name}
                    <div>
                        <CopyLeagueJoinLink league={league} />
                    </div>
                </SectionHeading>
                <NewGameForm league={league} />
                <LeaguePlayers league={league} />
                <RecentGames league={league} />
            </PageContainer>
        </Layout>
    );
};

export default LeaguePage;
