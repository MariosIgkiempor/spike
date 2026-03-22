import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/features/users/user-card';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { Search, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { FC, useMemo, useState } from 'react';

export type TeamStats = {
    players: User[];
    played: number;
    won: number;
};

type SortKey = 'wins' | 'winRate' | 'played';

interface TeamStatsProps {
    stats: TeamStats[];
}

export const TeamStats: FC<TeamStatsProps> = ({ stats }) => {
    const [search, setSearch] = useState('');
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDesc, setSortDesc] = useState(true);

    const filteredStats = useMemo(() => {
        let result = stats;

        if (search.length > 0) {
            result = result.filter((team) => team.players.some((p) => p.name.toLowerCase().includes(search.toLowerCase())));
        }

        if (sortKey) {
            result = [...result].sort((a, b) => {
                let aVal: number;
                let bVal: number;

                switch (sortKey) {
                    case 'wins':
                        aVal = a.won;
                        bVal = b.won;
                        break;
                    case 'winRate':
                        aVal = a.played > 0 ? a.won / a.played : 0;
                        bVal = b.played > 0 ? b.won / b.played : 0;
                        break;
                    case 'played':
                        aVal = a.played;
                        bVal = b.played;
                        break;
                }

                return sortDesc ? bVal - aVal : aVal - bVal;
            });
        }

        return result;
    }, [stats, search, sortKey, sortDesc]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDesc(!sortDesc);
        } else {
            setSortKey(key);
            setSortDesc(true);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                    type="search"
                    placeholder="Search by player name..."
                    value={search}
                    onChange={({ target }) => setSearch(target.value)}
                    className="max-w-md"
                />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Sort:</span>
                    {(
                        [
                            { key: 'wins', label: 'Wins' },
                            { key: 'winRate', label: 'Win %' },
                            { key: 'played', label: 'Played' },
                        ] as const
                    ).map(({ key, label }) => (
                        <Button key={key} variant={sortKey === key ? 'default' : 'outline'} size="sm" onClick={() => toggleSort(key)}>
                            {label}
                            {sortKey === key && <span className="ml-1">{sortDesc ? '↓' : '↑'}</span>}
                        </Button>
                    ))}
                    {sortKey && (
                        <button onClick={() => setSortKey(null)} className="rounded-sm p-0.5 hover:bg-muted">
                            <X className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {stats.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center gap-4 py-16"
                >
                    <div className="flex size-16 items-center justify-center rounded-2xl bg-muted">
                        <Users className="size-8 text-muted-foreground" />
                    </div>
                    <div className="text-center">
                        <h3 className="font-display text-lg tracking-wider uppercase">No team stats yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Play some games and team combinations will appear here</p>
                    </div>
                </motion.div>
            ) : filteredStats.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center gap-3 py-12"
                >
                    <div className="flex size-12 items-center justify-center rounded-xl bg-muted">
                        <Search className="size-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No teams match your search</p>
                </motion.div>
            ) : (
                <ul className="flex flex-col gap-3">
                    <AnimatePresence mode="popLayout">
                        {filteredStats.map((team, index) => (
                            <TeamStatsCard
                                key={team.players
                                    .map((p) => p.id)
                                    .sort()
                                    .join('-')}
                                team={team}
                                rank={index + 1}
                                index={index}
                            />
                        ))}
                    </AnimatePresence>
                </ul>
            )}
        </div>
    );
};

const TeamStatsCard: FC<{ team: TeamStats; rank: number; index: number }> = ({ team, rank, index }) => {
    const losses = team.played - team.won;
    const differential = team.won - losses;
    const winRate = team.played > 0 ? team.won / team.played : 0;

    return (
        <motion.li
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.5) }}
            className={cn(
                'grid grid-cols-[1fr_1fr_1fr_6fr] items-center gap-4 rounded-xl border bg-card px-4 py-4 shadow-2xs',
                rank === 1 && 'border-l-4 border-l-yellow-500/60',
                rank === 2 && 'border-l-4 border-l-gray-400/60',
                rank === 3 && 'border-l-4 border-l-amber-700/60',
            )}
        >
            <div>
                <RankBadge rank={rank} />
            </div>

            <div className="flex flex-col gap-1">
                <div className="flex -space-x-2">
                    {team.players.map((player) => (
                        <UserAvatar key={player.id} user={player} size="sm" className="ring-2 ring-card sm:size-8" />
                    ))}
                </div>
                <p className="max-w-full truncate text-xs font-medium text-foreground">{team.players.map((p) => p.name.split(' ')[0]).join(' & ')}</p>
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="font-display text-xl leading-none tabular-nums">
                    {team.won}/{losses}
                </span>
                <Badge variant={differential > 0 ? 'success' : differential < 0 ? 'destructive' : 'outline'} className="w-8">
                    {differential > 0 ? '+' : ''}
                    {differential}
                </Badge>
            </div>

            <div className="hidden flex-col gap-0.5 sm:flex">
                <span className={cn('text-xs font-medium', winRate >= 0.5 ? 'text-success-foreground' : 'text-destructive-foreground')}>{Intl.NumberFormat('en-GB', { style: 'percent' }).format(winRate)}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn('h-full rounded-full transition-all', winRate >= 0.5 ? 'bg-success-foreground' : 'bg-destructive-foreground')}
                        style={{ width: `${winRate * 100}%` }}
                    />
                </div>
            </div>
        </motion.li>
    );
};

const RankBadge: FC<{ rank: number }> = ({ rank }) => {
    const medalStyles: Record<number, string> = {
        1: 'bg-yellow-500/25 text-yellow-600 ring-yellow-500/50 dark:text-yellow-400',
        2: 'bg-gray-400/25 text-gray-500 ring-gray-400/50 dark:text-gray-300',
        3: 'bg-amber-700/25 text-amber-800 ring-amber-700/50 dark:text-amber-500',
    };

    if (rank <= 3) {
        return (
            <div className={cn('flex size-9 items-center justify-center rounded-full font-display text-lg ring-1', medalStyles[rank])}>{rank}</div>
        );
    }

    return <div className="flex size-9 items-center justify-center text-sm font-medium text-muted-foreground">{rank}</div>;
};
