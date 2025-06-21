import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, League, PageProps, Resource, User } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { FC, FormEventHandler } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface LeagueJoinPageProps extends PageProps {
    league: Resource<League>;
}

const LeagueJoinPage: FC<LeagueJoinPageProps> = ({ league, auth: { user } }) => {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Join ${league.data.name}`} />
            <PageContainer>
                <SectionHeading>
                    You have been invited to join the
                    <br />
                    <span className={'text-amber-600'}>{league.data.name}</span>
                    <br />
                    league
                </SectionHeading>
                <LeagueJoinForm user={user} league={league.data} />
            </PageContainer>
        </AppLayout>
    );
};

export default LeagueJoinPage;

const LeagueJoinForm: FC<{ league: League; user: User }> = ({ league, user }) => {
    const form = useForm({
        league_id: league.id,
    });
    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post(route('api.leagues.join', { league: league.id, user: user.id }), {
            onSuccess: () => {
                form.reset();
            },
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <PageSection>
                <Button disabled={form.processing}>Click here to join</Button>
            </PageSection>
        </form>
    );
};
