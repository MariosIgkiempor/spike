import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageSection } from '@/components/ui/pageSection';
import { SectionHeading } from '@/components/ui/sectionHeading';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { Game, League, Paginated } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { FC, useState } from 'react';

const fetchGames = async (leagueId: number, search: string) => {
    const response = await fetch(
        route('api.games.index', {
            league: leagueId,
            search: search.length > 0 ? search : undefined,
        }),
    );
    if (!response.ok) {
        throw new Error('Could not fetch recent games');
    }
    return response.json();
};

type RecentGamesProps = {
    league: League;
};

export const RecentGames: FC<RecentGamesProps> = ({ league }) => {
    const [searchQuery, setSearchQuery] = useState<string>('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const {
        data: gamesData,
        isLoading,
        error,
    } = useQuery<Paginated<Game>>({
        queryKey: ['games', league.id, debouncedSearch],
        queryFn: async () => fetchGames(league.id, debouncedSearch),
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
