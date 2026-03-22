// TeamStats UI
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/features/users/user-card';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import {
    ColumnDef,
    ColumnFiltersState,
    ExpandedState,
    getCoreRowModel,
    getExpandedRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { X } from 'lucide-react';
import { FC, useState } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

export type LeaderboardUser = User & {
    rank: number;
    win_rate: number;
    total_games: number;
    wins: number;
    losses: number;
    score_diff: number;
    mmr: number;
    mmr_history: { game: number; mmr: number }[];
    current_streak: number;
};

export type Leaderboard = LeaderboardUser[];

export type HeadToHead = Record<number, Record<number, { wins: number; losses: number }>>;
export type PlayerTeammateStats = Record<number, Record<number, { games: number; wins: number }>>;

interface LeaderboardProps {
    leaderboard: LeaderboardUser[];
    headToHead?: HeadToHead;
    playerTeammateStats?: PlayerTeammateStats;
}

const podiumAccents: Record<number, string> = {
    1: 'border-l-4 border-l-yellow-500/60 bg-yellow-500/[0.03]',
    2: 'border-l-4 border-l-gray-400/60 bg-gray-400/[0.03]',
    3: 'border-l-4 border-l-amber-700/60 bg-amber-700/[0.03]',
};

export const LeaderboardTable: FC<LeaderboardProps> = ({ leaderboard, headToHead, playerTeammateStats }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [expanded, setExpanded] = useState<ExpandedState>({});
    const [search, setSearch] = useState('');

    const columns: ColumnDef<LeaderboardUser>[] = [
        {
            accessorKey: 'rank',
            header: () => null,
            cell: ({ row }) => {
                const rank = row.original.rank;
                const medalColors: Record<number, string> = {
                    1: 'text-yellow-500',
                    2: 'text-gray-400',
                    3: 'text-amber-700',
                };
                return <span className={`font-display text-lg ${medalColors[rank] ?? ''}`}>{rank}</span>;
            },
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
            cell: ({ row }) => {
                const history = row.original.mmr_history;
                const trending = history.length >= 2 && history[history.length - 1].mmr >= history[0].mmr;
                return (
                    <div>
                        <div className="flex items-center gap-4">
                            <UserAvatar user={row.original} />
                            <div className="font-semibold">{row.original.name}</div>
                        </div>
                        {history.length >= 2 && (
                            <div className="mt-1 h-5 w-20">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={history}>
                                        <Line
                                            type="monotone"
                                            dataKey="mmr"
                                            stroke={trending ? 'var(--success-foreground)' : 'var(--destructive-foreground)'}
                                            strokeWidth={1.5}
                                            dot={false}
                                            isAnimationActive={false}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: 'mmr',
            header: ({ column }) => <DataTableColumnHeader column={column} title="MMR" />,
            cell: ({ row }) => <span className="flex font-semibold tabular-nums">{row.original.mmr}</span>,
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: 'current_streak',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Streak" />,
            cell: ({ row }) => {
                const streak = row.original.current_streak;
                if (streak === 0) return <span className="text-muted-foreground">—</span>;
                const isWin = streak > 0;
                return (
                    <span className={cn('font-semibold tabular-nums', isWin ? 'text-success-foreground' : 'text-destructive-foreground')}>
                        {isWin ? `W${streak}` : `L${Math.abs(streak)}`}
                    </span>
                );
            },
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: 'wins',
            header: ({ column }) => <DataTableColumnHeader column={column} title="W/L" />,
            cell: ({ row }) => (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="block text-center tabular-nums">
                        {row.original.wins}/{row.original.losses}
                    </span>
                    <Badge variant={row.original.win_rate >= 0.5 ? 'success' : 'destructive'}>
                        {Intl.NumberFormat('en-GB', { style: 'percent' }).format(row.original.win_rate)}
                    </Badge>
                </div>
            ),
            enableSorting: true,
            enableHiding: false,
        },
        {
            accessorKey: 'score_diff',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Avg +/-" />,
            cell: ({ row }) => {
                const avg = row.original.total_games > 0 ? row.original.score_diff / row.original.total_games : 0;
                const rounded = Math.round(avg * 10) / 10;
                const display = rounded > 0 ? `+${rounded}` : `${rounded}`;
                return (
                    <span>
                        <Badge variant={rounded > 0 ? 'success' : rounded < 0 ? 'destructive' : 'outline'}>{display}</Badge>
                    </span>
                );
            },
            enableSorting: true,
            enableHiding: false,
        },
    ];

    const columnNames: Record<string, string> = {
        rank: 'Rank',
        name: 'Player',
        mmr: 'MMR',
        current_streak: 'Streak',
        wins: 'W/L',
        score_diff: 'Avg +/-',
    };

    const table = useReactTable({
        data: leaderboard,
        columns,
        state: {
            sorting,
            columnFilters,
            expanded,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onExpandedChange: setExpanded,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
    });

    const onSearchChange = (value: string) => {
        setSearch(value);
        if (value.length === 0) table.getColumn('name')?.setFilterValue(undefined);
        else table.getColumn('name')?.setFilterValue(() => search);
    };

    return (
        <>
            <div className={'flex flex-col items-baseline gap-2 sm:flex-row'}>
                <Input
                    type="search"
                    placeholder="Search by player name..."
                    value={search}
                    onChange={({ target }) => onSearchChange(target.value)}
                    className="max-w-md"
                />
                {sorting.length > 0 && (
                    <Badge variant="outline" className="h-8">
                        {sorting.map((sort) => (
                            <span key={sort.id} className="flex items-center gap-1">
                                {columnNames[sort.id]} {sort.desc ? '↓' : '↑'}
                            </span>
                        ))}
                        <button onClick={() => setSorting([])} className="ml-2 rounded-sm p-0.5 hover:bg-muted">
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                )}
            </div>
            <DataTable
                table={table}
                onRowClick={(row) => row.toggleExpanded()}
                rowClassName={(row) => podiumAccents[row.original.rank] ?? ''}
                renderSubComponent={({ row }) => (
                    <ExpandedPlayerStats
                        player={row.original}
                        leaderboard={leaderboard}
                        headToHead={headToHead}
                        playerTeammateStats={playerTeammateStats}
                    />
                )}
            />
        </>
    );
};

const ExpandedPlayerStats: FC<{
    player: LeaderboardUser;
    leaderboard: LeaderboardUser[];
    headToHead?: HeadToHead;
    playerTeammateStats?: PlayerTeammateStats;
}> = ({ player, leaderboard, headToHead, playerTeammateStats }) => {
    const h2hData = headToHead?.[player.id];
    const teammateData = playerTeammateStats?.[player.id];

    const opponents = h2hData
        ? Object.entries(h2hData)
              .map(([opponentId, record]) => {
                  const opponent = leaderboard.find((u) => u.id === Number(opponentId));
                  if (!opponent) return null;
                  const total = record.wins + record.losses;
                  return { ...record, opponent, total, winRate: total > 0 ? record.wins / total : 0 };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null)
              .sort((a, b) => b.winRate - a.winRate)
        : [];

    const teammates = teammateData
        ? Object.entries(teammateData)
              .map(([teammateId, record]) => {
                  const teammate = leaderboard.find((u) => u.id === Number(teammateId));
                  if (!teammate) return null;
                  return { ...record, teammate, winRate: record.games > 0 ? record.wins / record.games : 0 };
              })
              .filter((x): x is NonNullable<typeof x> => x !== null)
              .sort((a, b) => b.winRate - a.winRate)
        : [];

    if (opponents.length === 0 && teammates.length === 0) {
        return <div className="px-6 py-4 text-sm text-muted-foreground">No game data yet.</div>;
    }

    return (
        <div className="grid gap-6 px-6 py-4 sm:grid-cols-2">
            {opponents.length > 0 && (
                <div>
                    <h4 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">vs Opponents</h4>
                    <div className="space-y-1.5">
                        {opponents.map(({ opponent, wins, losses, winRate }) => (
                            <div key={opponent.id} className="flex items-center gap-2 text-sm">
                                <UserAvatar user={opponent} size="xs" />
                                <span className="min-w-0 flex-1 truncate">{opponent.name}</span>
                                <span className="text-muted-foreground tabular-nums">
                                    {wins}W-{losses}L
                                </span>
                                <Badge variant={winRate >= 0.5 ? 'success' : 'destructive'} className="min-w-[3rem] justify-center">
                                    {Intl.NumberFormat('en-GB', { style: 'percent' }).format(winRate)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {teammates.length > 0 && (
                <div>
                    <h4 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">with Teammates</h4>
                    <div className="space-y-1.5">
                        {teammates.map(({ teammate, games, wins, winRate }, index) => {
                            const isBest = index === 0 && games >= 3;
                            const isWorst = index === teammates.length - 1 && games >= 3 && teammates.length > 1;
                            return (
                                <div key={teammate.id} className="flex items-center gap-2 text-sm">
                                    <UserAvatar user={teammate} size="xs" />
                                    <span className={cn('min-w-0 flex-1 truncate', isBest && 'font-semibold')}>{teammate.name}</span>
                                    <span className="text-muted-foreground tabular-nums">
                                        {wins}W/{games}G
                                    </span>
                                    <Badge variant={winRate >= 0.5 ? 'success' : 'destructive'} className="min-w-[3rem] justify-center">
                                        {Intl.NumberFormat('en-GB', { style: 'percent' }).format(winRate)}
                                    </Badge>
                                    {isBest && <span title="Best teammate">★</span>}
                                    {isWorst && <span title="Worst teammate">⚠</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
