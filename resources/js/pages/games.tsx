import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { NewGameForm } from '@/features/new-game/newGameForm';
import { useDebounce } from '@/hooks/useDebounce';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Game, PageProps, Paginated } from '@/types';
import { Head } from '@inertiajs/react';
import { useQuery } from '@tanstack/react-query';
import { type FC, PropsWithChildren, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Games', href: '/games' },
];

const PageContainer: FC<PropsWithChildren> = ({ children }) => {
    return <div className={'container my-4 space-y-12 px-4 lg:my-6 lg:px-6'}>{children}</div>;
};

const NewGameSection: FC = () => {
    return (
        <PageSection>
            <SectionHeading>New Game</SectionHeading>
            <NewGameForm />
        </PageSection>
    );
};

export default function Index(_props: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Games" />
            <PageContainer>
                <NewGameSection />
                <RecentGames />
            </PageContainer>
        </AppLayout>
    );
}

const fetchGames = async (search: string) => {
    const response = await fetch(route('api.games.index', { search: search.length > 0 ? search : undefined }), {
        headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
        },
    });
    if (!response.ok) {
        throw new Error('Could not fetch recent games');
    }
    return response.json();
};

const PageSection: FC<PropsWithChildren> = ({ children }) => {
    return <div className={'space-y-4'}>{children}</div>;
};

const SectionHeading: FC<PropsWithChildren> = ({ children }) => {
    return <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{children}</h2>;
};

const RecentGames: FC = () => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const {
        data: gamesData,
        isLoading,
        error,
    } = useQuery<Paginated<Game>>({
        queryKey: ['games', debouncedSearch],
        queryFn: async () => fetchGames(debouncedSearch),
    });

    return (
        <PageSection>
            <div className="flex items-center justify-between">
                <SectionHeading>Recent Games</SectionHeading>
                <Input
                    type="search"
                    placeholder="Search by user name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {isLoading ? (
                <Skeleton className={'h-32 w-full'} />
            ) : error ? (
                <div className="text-red-500 dark:text-red-400">Error: {error.message}</div>
            ) : (
                <div className={'space-y-4'}>
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {gamesData?.data.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">No games found.</div>
                        ) : (
                            gamesData?.data.map((game: Game) => <ScoreboardRow key={game.id} game={game} />)
                        )}
                    </div>
                </div>
            )}
        </PageSection>
    );
};

const ScoreboardRow: FC<{ game: Game }> = ({ game }) => {
    const team1 = game.teams[0];
    const team2 = game.teams[1];

    return (
        <div className="flex flex-col items-center justify-between gap-4 border-b border-gray-200 py-2 last:border-b-0 md:flex-row dark:border-gray-800">
            <div className="flex flex-1 flex-col items-center md:items-end">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {team1.players[0].name} & {team1.players[1].name}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant={team1.won ? 'success' : team2.won ? 'destructive' : 'secondary'} className="px-4 py-2 text-lg">
                    {game.scores[0]}
                </Badge>
                <span className="text-xl font-bold text-muted-foreground">-</span>
                <Badge variant={team2.won ? 'success' : team1.won ? 'destructive' : 'secondary'} className="px-4 py-2 text-lg">
                    {game.scores[1]}
                </Badge>
            </div>
            <div className="flex flex-1 flex-col items-center md:items-start">
                <div className="font-semibold text-gray-900 dark:text-gray-100">
                    {team2.players[0].name} & {team2.players[1].name}
                </div>
            </div>
            <div className="hidden min-w-[100px] text-center text-sm text-muted-foreground md:block">
                {new Date(game.createdAt).toLocaleDateString()}
            </div>
        </div>
    );
};
