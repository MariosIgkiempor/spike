import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PageSection } from '@/components/ui/pageSection';
import { NewLeagueForm } from '@/features/leagues/new-league-form';
import { League } from '@/types';
import { Link } from '@inertiajs/react';
import { FC } from 'react';

export const MyLeagues: FC<{ leagues: League[] }> = ({ leagues }) => {
    return (
        <PageSection
            title={'My Leagues'}
            extra={
                <Dialog>
                    <DialogTrigger asChild>
                        <Button>New</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New League</DialogTitle>
                        </DialogHeader>
                        <NewLeagueForm />
                    </DialogContent>
                </Dialog>
            }
        >
            <div className={'space-y-4'}>
                {leagues.map((league) => (
                    <article key={league.id}>
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
