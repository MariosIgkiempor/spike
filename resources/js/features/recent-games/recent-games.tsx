import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { cn } from '@/lib/utils';
import { Game, League, Team } from '@/types';
import { Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { EllipsisVertical, Search, Swords, Trash } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FC, useState } from 'react';

type RecentGamesProps = {
    league: League;
    canDeleteGames: boolean;
};

export const RecentGames: FC<RecentGamesProps> = ({ league, canDeleteGames }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredGames = league.games.filter((game) => {
        if (searchQuery.length === 0) return true;
        return game.teams.some((team) => team.players.some((player) => player.name.toLowerCase().includes(searchQuery.toLowerCase())));
    });

    return (
        <>
            <div>
                <Input
                    type="search"
                    placeholder="Search by user name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            {league.games.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-4 py-16"
                >
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                        <Swords className="size-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-display text-lg tracking-wider uppercase">No games yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Record your first match to get started</p>
                    </div>
                </motion.div>
            ) : filteredGames.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-3 py-12"
                >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                        <Search className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No games match your search</p>
                </motion.div>
            ) : (
                <ul className="flex w-fit flex-col items-center gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredGames.map((game, index) => (
                            <GameRecord key={game.id} game={game} index={index} canDeleteGames={canDeleteGames} />
                        ))}
                    </AnimatePresence>
                </ul>
            )}
        </>
    );
};

const GameRecord: FC<{ game: Game; index: number; canDeleteGames: boolean }> = ({ game, index, canDeleteGames }) => {
    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
            className="py-4"
        >
            <div className="mb-3 flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <time>{format(game.createdAt, 'd MMM yyyy')}</time>
                <GameActions game={game} canDeleteGames={canDeleteGames} />
            </div>

            <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 sm:gap-3">
                <TeamSide team={game.teams[0]} align="right" />

                <span
                    className={cn(
                        'font-display text-2xl leading-none tabular-nums sm:text-3xl',
                        game.teams[0].won ? 'text-success' : 'text-destructive',
                    )}
                >
                    {game.teams[0].score}
                </span>

                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">vs</span>

                <span
                    className={cn(
                        'font-display text-2xl leading-none tabular-nums sm:text-3xl',
                        game.teams[1].won ? 'text-success' : 'text-destructive',
                    )}
                >
                    {game.teams[1].score}
                </span>

                <TeamSide team={game.teams[1]} align="left" />
            </div>
        </motion.li>
    );
};

const TeamSide: FC<{ team: Team; align: 'left' | 'right' }> = ({ team, align }) => {
    const isRight = align === 'right';

    return (
        <div className={cn('flex min-w-0 flex-col gap-1.5', isRight ? 'items-end' : 'items-start')}>
            <div className={cn('flex -space-x-2', isRight && 'flex-row-reverse space-x-reverse')}>
                {team.players.map((player) => (
                    <Avatar key={player.id} className="size-7 ring-2 ring-card sm:size-8">
                        <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
                            {player.name
                                .split(' ')
                                .map((n) => n.charAt(0))
                                .join('')}
                        </AvatarFallback>
                    </Avatar>
                ))}
            </div>
            <p className={cn('max-w-full truncate text-xs text-muted-foreground', isRight && 'text-right')}>
                {team.players.map((p) => p.name.split(' ')[0]).join(' & ')}
            </p>
        </div>
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
