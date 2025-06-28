import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { FormError } from '@/components/ui/formError';
import { FormField } from '@/components/ui/formField';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
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
        <form onSubmit={handleSubmit} className={'block space-y-4'}>
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
        </form>
    );
};

const MyLeagues: FC<{ leagues: League[] }> = ({ leagues }) => {
    return (
        <PageSection
            title={'My Leagues'}
            extra={
                <Dialog>
                    <DialogTrigger>
                        <Button>New</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <NewLeagueForm />
                    </DialogContent>
                </Dialog>
            }
        >
            <div className={'space-y-4'}>
                {leagues.map((league) => (
                    <article>
                        <Link href={route('web.leagues.show', { league: league.id })} key={league.id} className={'-m-2 block p-2 hover:bg-accent'}>
                            <h3 className={'text-lg font-semibold'}>{league.name}</h3>
                            <div>3 players</div>
                        </Link>
                    </article>
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
                <MyLeagues leagues={leagues.data} />
            </PageContainer>
        </AppLayout>
    );
}
