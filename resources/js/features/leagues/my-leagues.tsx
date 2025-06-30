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
                        <Link
                            prefetch
                            href={route('web.leagues.show', { league: league.id })}
                            key={league.id}
                            className={'-mx-6 -my-2 block px-6 py-2 hover:bg-secondary hover:text-secondary-foreground'}
                        >
                            <h3 className={'text-lg font-semibold'}>{league.name}</h3>
                            <div>{league.players.length} players</div>
                        </Link>
                    </article>
                ))}
            </div>
        </PageSection>
    );
};
