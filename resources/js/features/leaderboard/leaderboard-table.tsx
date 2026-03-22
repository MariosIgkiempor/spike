// TeamStats UI
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Input } from '@/components/ui/input';
import { UserAvatar, UserCard } from '@/features/users/user-card';
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
    Row,
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
};

export type Leaderboard = LeaderboardUser[];

export type HeadToHead = Record<number, Record<number, { wins: number; losses: number }>>;
export type PlayerTeammateStats = Record<number, Record<number, { games: number; wins: number }>>;

interface LeaderboardProps {
    leaderboard: LeaderboardUser[];
    headToHead?: HeadToHead;
    playerTeammateStats?: PlayerTeammateStats;
}

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
            enableHiding: true,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
            cell: ({ row }) => <UserCard user={row.original} />,
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'win_rate',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Win Rate" />,
            cell: ({ row }) => (
                <span>
                    <Badge variant={row.original.win_rate >= 0.5 ? 'success' : 'destructive'}>
                        {Intl.NumberFormat('en-GB', { style: 'percent' }).format(row.original.win_rate)}
                    </Badge>
                </span>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'mmr',
            header: ({ column }) => <DataTableColumnHeader column={column} title="MMR" />,
            cell: ({ row }) => <span className="flex font-semibold tabular-nums">{row.original.mmr}</span>,
            enableSorting: true,
            enableHiding: true,
        },
        {
            id: 'mmr_trend',
            header: () => <span className="text-xs text-muted-foreground">Trend</span>,
            cell: ({ row }) => {
                const history = row.original.mmr_history;
                if (history.length < 2) return null;
                const trending = history[history.length - 1].mmr >= history[0].mmr;
                return (
                    <div className="h-8 w-24">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history}>
                                <Line
                                    type="monotone"
                                    dataKey="mmr"
                                    stroke={trending ? 'var(--success)' : 'var(--destructive)'}
                                    strokeWidth={1.5}
                                    dot={false}
                                    isAnimationActive={false}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                );
            },
            enableSorting: false,
            enableHiding: true,
        },
        {
            accessorKey: 'total_games',
            header: ({ column }) => <DataTableColumnHeader column={column} title="# Games" />,
            cell: ({ row }) => <span className="">{row.original.total_games}</span>,
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'wins',
            header: ({ column }) => <DataTableColumnHeader column={column} title="W/L" />,
            cell: ({ row }) => (
                <div className="flex flex-wrap items-center gap-1">
                    <span className="block text-center">
                        {row.original.wins}/{row.original.losses}
                    </span>
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'score_diff',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Score +-" />,
            cell: ({ row }) => (
                <span>
                    <Badge variant={row.original.score_diff > 0 ? 'success' : row.original.score_diff < 0 ? 'destructive' : 'outline'}>
                        {row.original.score_diff}
                    </Badge>
                </span>
            ),
            enableSorting: true,
            enableHiding: true,
        },
    ];

    const columnNames: Record<string, string> = {
        rank: 'Rank',
        name: 'Player',
        win_rate: 'Win Rate',
        mmr: 'MMR',
        mmr_trend: 'Trend',
        total_games: '# Games',
        wins: 'W/L',
        score_diff: 'Score Diff',
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
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        vs Opponents
                    </h4>
                    <div className="space-y-1.5">
                        {opponents.map(({ opponent, wins, losses, total, winRate }) => (
                            <div key={opponent.id} className="flex items-center gap-2 text-sm">
                                <UserAvatar user={opponent} className="size-6" />
                                <span className="min-w-0 flex-1 truncate">{opponent.name}</span>
                                <span className="tabular-nums text-muted-foreground">
                                    {wins}W-{losses}L
                                </span>
                                <Badge
                                    variant={winRate >= 0.5 ? 'success' : 'destructive'}
                                    className="min-w-[3rem] justify-center"
                                >
                                    {Intl.NumberFormat('en-GB', { style: 'percent' }).format(winRate)}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {teammates.length > 0 && (
                <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        with Teammates
                    </h4>
                    <div className="space-y-1.5">
                        {teammates.map(({ teammate, games, wins, winRate }, index) => {
                            const isBest = index === 0 && games >= 3;
                            const isWorst = index === teammates.length - 1 && games >= 3 && teammates.length > 1;
                            return (
                                <div key={teammate.id} className="flex items-center gap-2 text-sm">
                                    <UserAvatar user={teammate} className="size-6" />
                                    <span className={cn('min-w-0 flex-1 truncate', isBest && 'font-semibold')}>
                                        {teammate.name}
                                    </span>
                                    <span className="tabular-nums text-muted-foreground">
                                        {wins}W/{games}G
                                    </span>
                                    <Badge
                                        variant={winRate >= 0.5 ? 'success' : 'destructive'}
                                        className="min-w-[3rem] justify-center"
                                    >
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
