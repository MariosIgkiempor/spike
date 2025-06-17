// Leaderboard UI
import { FC, useState } from 'react';
import {
    ColumnDef,
    ColumnFiltersState,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable
} from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { User } from '@/types';

type LeaderBoardUser = User & {
    rank: number;
    win_rate: number;
    total_games: number;
    wins: number;
    losses: number;
    score_diff: number;
};

export const Leaderboard: FC<{ leaderboard: LeaderBoardUser[] }> = ({ leaderboard }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [search, setSearch] = useState('');

    const columns: ColumnDef<LeaderBoardUser>[] = [
        {
            accessorKey: 'rank',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Rank" />,
            cell: ({ row }) => <span className="block text-center font-medium">{row.original.rank}</span>,
            enableSorting: true,
            enableHiding: true
        },
        {
            accessorKey: 'name',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Player" />,
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
            enableSorting: true,
            enableHiding: true
        },
        {
            accessorKey: 'win_rate',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Win Rate" />,
            cell: ({ row }) => (
                <span className="block text-center">
                    <Badge
                        variant={row.original.win_rate >= 50 ? 'success' : 'destructive'}>{row.original.win_rate}%</Badge>
                </span>
            ),
            enableSorting: true,
            enableHiding: true
        },
        {
            accessorKey: 'total_games',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Total Games" />,
            cell: ({ row }) => <span className="block text-center">{row.original.total_games}</span>,
            enableSorting: true,
            enableHiding: true
        },
        {
            accessorKey: 'wins',
            header: ({ column }) => <DataTableColumnHeader column={column} title="W/L" />,
            cell: ({ row }) => (
                <div className="gitems-center flex flex-wrap gap-1">
                    <span className="block text-center">
                        {row.original.wins}/{row.original.losses}
                    </span>
                    <Badge
                        variant={
                            row.original.wins > row.original.losses
                                ? 'success'
                                : row.original.wins < row.original.losses
                                    ? 'destructive'
                                    : 'secondary'
                        }
                    >
                        {row.original.wins - row.original.losses > 0 ? '+' : ''}
                        {row.original.wins - row.original.losses}
                    </Badge>
                </div>
            ),
            enableSorting: true,
            enableHiding: true
        },
        {
            accessorKey: 'score_diff',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Score Difference" />,
            cell: ({ row }) => (
                <span className="flex justify-center">
                    <Badge
                        variant={row.original.score_diff > 0 ? 'success' : row.original.score_diff < 0 ? 'destructive' : 'secondary'}>
                        {row.original.score_diff}
                    </Badge>
                </span>
            ),
            enableSorting: true,
            enableHiding: true
        }
    ];

    const columnNames: Record<string, string> = {
        rank: 'Rank',
        name: 'Player',
        win_rate: 'Win Rate',
        total_games: 'Total Games',
        wins: 'W/L',
        score_diff: 'Score Difference'
    };

    const table = useReactTable({
        data: leaderboard,
        columns,
        state: {
            sorting,
            columnFilters
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel()
    });

    const onSearchChange = (value: string) => {
        setSearch(value);
        table.getColumn('name')?.setFilterValue(search);
    };

    return (
        <div className="mb-8">
            <div className="mb-2 flex items-baseline justify-between gap-2">
                <h2 className="text-2xl font-semibold">Player Leaderboard</h2>
                <div className="flex flex-1 flex-wrap justify-end gap-2">
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
                    <Input
                        type="search"
                        placeholder="Search by player name..."
                        value={search}
                        onChange={({ target }) => onSearchChange(target.value)}
                        className="max-w-md"
                    />
                </div>
            </div>
            <DataTable table={table} />
        </div>
    );
};
