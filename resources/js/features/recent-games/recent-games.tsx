import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { PageSection } from '@/components/ui/pageSection';
import { UserCard } from '@/features/users/user-card';
import { Game, League } from '@/types';
import { Link, router } from '@inertiajs/react';
import { format, isBefore } from 'date-fns';
import { EllipsisVertical, Trash } from 'lucide-react';
import { FC, useState } from 'react';

type RecentGamesProps = {
    league: League;
    canDeleteGames: boolean;
};

export const RecentGames: FC<RecentGamesProps> = ({ league, canDeleteGames }) => {
    const [searchQuery, setSearchQuery] = useState('');

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
            {league.games.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No games found.</div>
            ) : (
                <ul className={'flex flex-col gap-8'}>
                    {league.games
                        .filter((game) => {
                            if (searchQuery.length === 0) return true;
                            return game.teams.some((team) =>
                                team.players.some((player) => player.name.toLowerCase().includes(searchQuery.toLowerCase())),
                            );
                        })
                        .sort((a, b) => (isBefore(a.createdAt, b.createdAt) ? 0 : 1))
                        .map((game) => (
                            <GameRecord key={game.id} game={game} canDeleteGames={canDeleteGames} />
                        ))}
                </ul>
            )}
        </PageSection>
    );
};

const GameRecord: FC<{ game: Game; canDeleteGames: boolean }> = ({ game, canDeleteGames }) => {
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
            <div className={'flex w-fit items-center gap-2.5 text-xs'}>
                <div>{format(game.createdAt, 'dd MMM yy')}</div>
                <div>
                    <GameActions game={game} canDeleteGames={canDeleteGames} />
                </div>
            </div>
        </li>
    );
};

const GameActions: FC<{ game: Game; canDeleteGames: boolean }> = ({ game, canDeleteGames }) => {
    const handleDelete = () => {
        router.reload();
    };

    if (!canDeleteGames) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size={'icon'}>
                    <EllipsisVertical />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuGroup>
                    <DropdownMenuItem variant={'destructive'} asChild>
                        <Link
                            method="delete"
                            href={route('api.games.destroy', { game: game.id })}
                            as="button"
                            onSuccess={handleDelete}
                            className={'w-full'}
                        >
                            Delete Game
                            <DropdownMenuShortcut>
                                <Trash className={'text-destructive-foreground'} />
                            </DropdownMenuShortcut>
                        </Link>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
