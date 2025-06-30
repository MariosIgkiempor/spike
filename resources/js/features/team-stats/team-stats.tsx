// TeamStats UI
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Input } from '@/components/ui/input';
import { UserCard } from '@/features/users/user-card';
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

export type TeamStats = {
    players: User[];
    played: number;
    won: number;
};

interface LeaderboardProps {
    stats: TeamStats[];
}

export const TeamStats: FC<LeaderboardProps> = ({ stats }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [search, setSearch] = useState('');

    const columns: ColumnDef<TeamStats>[] = [
        {
            accessorKey: 'rank',
            header: () => null,
            cell: ({ row }) => <span>{row.index}</span>,
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'players',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Players" />,
            cell: ({ row }) => (
                <div className="flex flex-col justify-start gap-4">
                    {row.original.players.map((p) => (
                        <UserCard key={p.id} user={p} />
                    ))}
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
            filterFn: (row, columnId, filterValue) => {
                return row.original.players.some((p) => p.name.toLowerCase().includes((filterValue as string).toLowerCase()));
            },
        },
        {
            accessorKey: 'played',
            header: ({ column }) => <DataTableColumnHeader column={column} title="Played" />,
            cell: ({ row }) => <span className="block text-center">{row.original.played}</span>,
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'won',
            header: ({ column }) => <DataTableColumnHeader column={column} title="W/L" />,
            cell: ({ row }) => {
                const losses = row.original.played - row.original.won;
                const { won, played } = row.original;
                return (
                    <div className="gitems-center flex flex-wrap gap-1">
                        <span className="block text-center">
                            {won}/{played - won}
                        </span>
                        <Badge variant={won > losses ? 'success' : won < losses ? 'destructive' : 'outline'} className={'w-8'}>
                            {won - losses > 0 ? '+' : ''}
                            {won - losses}
                        </Badge>
                    </div>
                );
            },
            enableSorting: true,
            enableHiding: true,
        },
    ];

    const columnNames: Record<string, string> = {
        rank: 'Rank',
        players: 'Players',
        played: 'Played',
        won: 'Won',
    };

    const table = useReactTable({
        data: stats,
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
        if (value.length === 0) table.getColumn('players')?.setFilterValue(undefined);
        else table.getColumn('players')?.setFilterValue(() => search);
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
