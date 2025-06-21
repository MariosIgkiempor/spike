import { Button } from '@/components/ui/button';
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
import { FC } from 'react';
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
        <PageSection>
            <SectionHeading>{league.players.length} players</SectionHeading>
            {leaderboard === undefined ? null : <Leaderboard leaderboard={leaderboard} isLoading={isLoading} />}
        </PageSection>
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

const LeaguePage: FC<LeaguePageProps> = ({ league: { data: league } }) => {
    return (
        <Layout>
            <Head title="league" />
            <PageContainer>
                <SectionHeading className={'flex w-full flex-col justify-between gap-2 md:flex-row'}>
                    {league.name}
                    <CopyLeagueJoinLink league={league} />
                </SectionHeading>
                <NewGameForm league={league} />
                <LeaguePlayers league={league} />
                <RecentGames league={league} />
            </PageContainer>
        </Layout>
    );
};

export default LeaguePage;
