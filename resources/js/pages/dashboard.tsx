import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { FormError } from '@/components/ui/formError';
import { FormField } from '@/components/ui/formField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, League, PageProps, ResourceCollection } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { FC, FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardPageProps extends PageProps {
    leagues: ResourceCollection<League>;
}

const NewLeagueForm: FC = () => {
    const form = useForm({
        name: '',
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        form.post(route('api.leagues.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
            },
            onError: () => {
                //
            },
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <PageSection>
                <SectionHeading>Create A League</SectionHeading>
                <FormField>
                    <Label htmlFor={'name'}>League Name</Label>
                    <Input
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        name={'name'}
                        placeholder={"Make sure it's a good pun"}
                    />
                    <FormError>{form.errors.name}</FormError>
                </FormField>

                <Button type={'submit'} disabled={form.processing}>
                    Submit
                </Button>
            </PageSection>
        </form>
    );
};

const MyLeagues: FC<{ leagues: League[] }> = ({ leagues }) => {
    return (
        <PageSection>
            <SectionHeading>My Leagues</SectionHeading>
            <div className={'grid gap-6 md:grid-cols-2'}>
                {leagues.map((league) => (
                    <Link href={route('web.leagues.show', { league: league.id })} key={league.id}>
                        <Card className={'hover:shadow-lg'}>
                            <CardHeader>
                                <CardTitle>{league.name}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </PageSection>
    );
};

export default function Dashboard({ leagues }: DashboardPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <PageContainer>
                <NewLeagueForm />
                <MyLeagues leagues={leagues.data} />
            </PageContainer>
        </AppLayout>
    );
}
