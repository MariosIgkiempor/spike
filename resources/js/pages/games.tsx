import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
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
    return <div className={'container space-y-12 px-4 lg:px-6'}>{children}</div>;
};

export default function Index(_props: PageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Games" />
            <PageContainer>
                <RecentGames />
            </PageContainer>
        </AppLayout>
    );
}
const RecentGames: FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const {
        data: gamesData,
        isLoading,
        error,
    } = useQuery<Paginated<Game>>({
        queryKey: ['games', debouncedSearch],
        queryFn: async () => {
            const response = await fetch(route('api.games.index'), {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });

    return (
        <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Recent Games</h2>
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
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                    {gamesData?.data.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">No games found.</div>
                    ) : (
                        gamesData?.data.map((game: Game) => <ScoreboardRow key={game.id} game={game} />)
                    )}
                </div>
            )}
        </div>
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
