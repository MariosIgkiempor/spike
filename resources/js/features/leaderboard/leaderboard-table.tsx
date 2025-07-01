// TeamStats UI
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import {
    ColumnDef,
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from '@tanstack/react-table';
import { X } from 'lucide-react';
import { FC, useState } from 'react';

export type LeaderboardUser = User & {
    rank: number;
    win_rate: number;
    total_games: number;
    wins: number;
    losses: number;
    score_diff: number;
    mmr: number;
};

export type Leaderboard = LeaderboardUser[];

interface LeaderboardProps {
    leaderboard: LeaderboardUser[];
}

export const LeaderboardTable: FC<LeaderboardProps> = ({ leaderboard }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [search, setSearch] = useState('');

    const columns: ColumnDef<LeaderboardUser>[] = [
        {
            accessorKey: 'rank',
            header: () => null,
            cell: ({ row }) => <span>{row.original.rank}</span>,
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
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
                    <Badge
                        variant={
                            row.original.wins > row.original.losses ? 'success' : row.original.wins < row.original.losses ? 'destructive' : 'muted'
                        }
                    >
                        {row.original.wins - row.original.losses > 0 ? '+' : ''}
                        {row.original.wins - row.original.losses}
                    </Badge>
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
                    <Badge variant={row.original.score_diff > 0 ? 'success' : row.original.score_diff < 0 ? 'destructive' : 'muted'}>
                        {row.original.score_diff}
                    </Badge>
                </span>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'mmr',
            header: ({ column }) => <DataTableColumnHeader column={column} title="MMR" />,
            cell: ({ row }) => <span className="flex">{row.original.mmr}</span>,
            enableSorting: true,
            enableHiding: true,
        },
    ];

    const columnNames: Record<string, string> = {
        rank: 'Rank',
        name: 'Player',
        win_rate: 'Win Rate',
        total_games: '# Games',
        wins: 'W/L',
        score_diff: 'Score Diff',
        mmr: 'MMR',
    };

    const table = useReactTable({
        data: leaderboard,
        columns,
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
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
            <DataTable table={table} />
        </>
    );
};
