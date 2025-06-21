import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import { Leaderboard, LeaderboardUser } from '@/features/leaderboard/leaderboard';
import { NewGameForm } from '@/features/new-game/newGameForm';
import { RecentGames } from '@/features/recent-games/recent-games';
import Layout from '@/layouts/app-layout';
import { League, Resource } from '@/types';
import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { FC } from 'react';

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
        <PageSection>
            <SectionHeading>{league.players.length} players</SectionHeading>
            {leaderboard === undefined ? null : <Leaderboard leaderboard={leaderboard} isLoading={isLoading} />}
        </PageSection>
    );
};

const LeaguePage: FC<{ league: Resource<League> }> = ({ league }) => {
    return (
        <Layout>
            <Head title="league" />
            <PageContainer>
                <SectionHeading>{league.data.name}</SectionHeading>
                <NewGameForm league={league.data} />
                <LeaguePlayers league={league.data} />
                <RecentGames league={league.data} />
            </PageContainer>
        </Layout>
    );
};

export default LeaguePage;
