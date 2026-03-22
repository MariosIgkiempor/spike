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
import { UserAvatar } from '@/features/users/user-card';
import { cn } from '@/lib/utils';
import { Game, League, Team } from '@/types';
import { Link, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { EllipsisVertical, Search, Swords, Trash, Trophy } from 'lucide-react';
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
                <div className="space-y-3">
                    <AnimatePresence mode="popLayout">
                        {filteredGames.map((game, index) => (
                            <GameRecord key={game.id} game={game} index={index} canDeleteGames={canDeleteGames} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </>
    );
};

const GameRecord: FC<{ game: Game; index: number; canDeleteGames: boolean }> = ({ game, index, canDeleteGames }) => {
    const scoreDiff = Math.abs(game.teams[0].score - game.teams[1].score);
    const isBlowout = scoreDiff >= 10;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
            className="overflow-hidden rounded-xl border bg-card shadow-sm"
        >
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2">
                <time className="text-sm font-medium text-foreground/60">{format(game.createdAt, 'd MMM yyyy')}</time>
                <div className="flex items-center gap-2">
                    {isBlowout && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold tracking-wide text-accent uppercase">
                            <Trophy className="size-3" />
                            Blowout
                        </span>
                    )}
                    <GameActions game={game} canDeleteGames={canDeleteGames} />
                </div>
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-4 sm:gap-5 sm:px-6">
                <TeamSide team={game.teams[0]} align="right" />

                <div className="flex items-center gap-2 sm:gap-3">
                    <span
                        className={cn(
                            'font-display text-3xl leading-none tabular-nums sm:text-4xl',
                            game.teams[0].won ? 'text-success-foreground' : 'text-destructive-foreground/60',
                        )}
                    >
                        {game.teams[0].score}
                    </span>

                    <span className="text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">vs</span>

                    <span
                        className={cn(
                            'font-display text-3xl leading-none tabular-nums sm:text-4xl',
                            game.teams[1].won ? 'text-success-foreground' : 'text-destructive-foreground/60',
                        )}
                    >
                        {game.teams[1].score}
                    </span>
                </div>

                <TeamSide team={game.teams[1]} align="left" />
            </div>
        </motion.div>
    );
};

const TeamSide: FC<{ team: Team; align: 'left' | 'right' }> = ({ team, align }) => {
    const isRight = align === 'right';

    return (
        <div className={cn('flex min-w-0 flex-col gap-1.5', isRight ? 'items-end' : 'items-start')}>
            <div className={cn('flex -space-x-1.5', isRight && 'flex-row-reverse space-x-reverse')}>
                {team.players.map((player) => (
                    <UserAvatar
                        key={player.id}
                        user={player}
                        variant={team.won ? 'success' : 'muted'}
                        className={cn('ring-2 sm:size-9', team.won ? 'ring-success/30' : 'ring-card')}
                    />
                ))}
            </div>
            <p
                className={cn(
                    'max-w-full truncate text-sm font-medium',
                    team.won ? 'text-foreground' : 'text-muted-foreground',
                    isRight && 'text-right',
                )}
            >
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
