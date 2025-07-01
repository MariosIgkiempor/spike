import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageSection } from '@/components/ui/pageSection';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCard } from '@/features/users/user-card';
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
                <>
                    {gamesData?.data.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">No games found.</div>
                    ) : (
                        <ul className={'flex flex-col gap-8'}>{gamesData?.data.map((game: Game) => <ScoreboardRow key={game.id} game={game} />)}</ul>
                    )}
                </>
            )}
        </PageSection>
    );
};

const ScoreboardRow: FC<{ game: Game }> = ({ game }) => {
    return (
        <li className={'flex justify-between gap-4'}>
            <div className={'flex flex-wrap justify-start gap-2'}>
                {game.teams.map((team) => (
                    <div key={team.id} className={'flex gap-4'}>
                        <Badge variant={team.won ? 'success' : 'destructive'} className={'text-md w-8 overflow-hidden font-semibold'}>
                            {team.score}
                        </Badge>
                        <ul className={'flex w-32 flex-col'}>
                            {team.players.map((player) => (
                                <UserCard key={player.id} user={player} />
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className={'w-24 text-xs'}>{format(game.createdAt, 'dd MMM yy')}</div>
        </li>
    );
};
