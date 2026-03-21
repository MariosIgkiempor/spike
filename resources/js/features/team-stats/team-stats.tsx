import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { X } from 'lucide-react';
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
            result = result.filter((team) =>
                team.players.some((p) => p.name.toLowerCase().includes(search.toLowerCase())),
            );
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
                    {([
                        { key: 'wins', label: 'Wins' },
                        { key: 'winRate', label: 'Win %' },
                        { key: 'played', label: 'Played' },
                    ] as const).map(({ key, label }) => (
                        <Button
                            key={key}
                            variant={sortKey === key ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleSort(key)}
                        >
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

            {filteredStats.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No teams found.</div>
            ) : (
                <ul className="flex flex-col gap-3">
                    <AnimatePresence mode="popLayout">
                        {filteredStats.map((team, index) => (
                            <TeamStatsCard
                                key={team.players.map((p) => p.id).sort().join('-')}
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
                'grid grid-cols-[1fr_1fr_1fr_6fr] items-center gap-4 bg-card py-4',
                rank <= 3 && 'border-primary/20',
            )}
        >
            <div>
                <RankBadge rank={rank} />
            </div>

            <div className="hidden flex-col gap-0.5 sm:flex">
                <span className="text-xs text-muted-foreground">
                    {Intl.NumberFormat('en-GB', { style: 'percent' }).format(winRate)}
                </span>
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                    <div
                        className={cn(
                            'h-full rounded-full transition-all',
                            winRate >= 0.5 ? 'bg-success' : 'bg-destructive',
                        )}
                        style={{ width: `${winRate * 100}%` }}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-0.5">
                <span className="font-display text-xl leading-none tabular-nums">
                    {team.won}/{losses}
                </span>
                <Badge
                    variant={differential > 0 ? 'success' : differential < 0 ? 'destructive' : 'outline'}
                    className="w-8"
                >
                    {differential > 0 ? '+' : ''}
                    {differential}
                </Badge>
            </div>
            <div className="flex flex-col gap-1">
                <div className="flex -space-x-2">
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
                <p className="max-w-full truncate text-xs text-muted-foreground">
                    {team.players.map((p) => p.name.split(' ')[0]).join(' & ')}
                </p>
            </div>

        </motion.li>
    );
};

const RankBadge: FC<{ rank: number }> = ({ rank }) => {
    const medalStyles: Record<number, string> = {
        1: 'bg-yellow-500/15 text-yellow-500 ring-yellow-500/30',
        2: 'bg-gray-400/15 text-gray-400 ring-gray-400/30',
        3: 'bg-amber-700/15 text-amber-700 ring-amber-700/30',
    };

    if (rank <= 3) {
        return (
            <div
                className={cn(
                    'flex size-9 items-center justify-center rounded-full font-display text-lg ring-1',
                    medalStyles[rank],
                )}
            >
                {rank}
            </div>
        );
    }

    return <div className="flex size-9 items-center justify-center text-sm text-muted-foreground">{rank}</div>;
};
