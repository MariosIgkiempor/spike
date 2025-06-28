import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageSection } from '@/components/ui/pageSection';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/hooks/useDebounce';
import { Game, League, Paginated } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
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
        <PageSection
            title={'Recent Games'}
            extra={
                <div>
                    <Input
                        type="search"
                        placeholder="Search by user name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
            }
        >
            {isLoading ? (
                <Skeleton className={'h-32 w-full'} />
            ) : error ? (
                <div className="text-red-500 dark:text-red-400">Error: {error.message}</div>
            ) : (
                <div className={'space-y-8'}>
                    {gamesData?.data.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">No games found.</div>
                    ) : (
                        gamesData?.data.map((game: Game) => <ScoreboardRow key={game.id} game={game} />)
                    )}
                </div>
            )}
        </PageSection>
    );
};

const ScoreboardRow: FC<{ game: Game }> = ({ game }) => {
    return (
        <div className={'grid gap-2.5 sm:grid-cols-[_1fr__1fr_80px]'}>
            {game.teams.map((team) => (
                <div key={team.id} className={'flex gap-4'}>
                    <Badge variant={team.won ? 'success' : 'outline'} className={'w-8 overflow-hidden'}>
                        {team.score}
                    </Badge>
                    <div>
                        {team.players.map((player) => (
                            <div key={player.id} className={'line-clamp-1 text-sm'}>
                                {player.name}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
            <div className={'text-xs'}>{format(game.createdAt, 'd MMM y')}</div>
        </div>
    );
};
