import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, PageProps, Game, User } from '@/types';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, type FC, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ColumnDef, SortingState, useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel, ColumnFiltersState } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { X } from 'lucide-react';
import { PlayerInput } from '@/components/PlayerInput';
import { generateFairTeams } from '@/lib/mmr';

interface Props extends PageProps {
    games: Game[];
    users: User[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Games', href: '/games' },
];

const NewGameForm: FC<{ initialTeams: { team1: User[], team2: User[] } | null }> = ({ initialTeams }) => {
    const { data, setData, post, processing, errors, reset } = useForm({
        team1_player1_id: initialTeams?.team1[0]?.id || null,
        team1_player2_id: initialTeams?.team1[1]?.id || null,
        team2_player1_id: initialTeams?.team2[0]?.id || null,
        team2_player2_id: initialTeams?.team2[1]?.id || null,
        team1_score: 21,
        team2_score: 21,
    });

    const team1Error = errors.team1_player1_id || errors.team1_player2_id || errors.team1_score;
    const team2Error = errors.team2_player1_id || errors.team2_player2_id || errors.team2_score;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('games.store'), {
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-8 items-center">
                {/* Team 1 */}
                <div className="space-y-4 w-full">
                    {team1Error && (
                        <div className="text-red-500 text-sm mb-2">{team1Error}</div>
                    )}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <PlayerInput
                                value={data.team1_player1_id}
                                onChange={(value) => setData('team1_player1_id', value)}
                                label="Player 1"
                                error={errors.team1_player1_id}
                            />
                        </div>
                        <div className="flex-1">
                            <PlayerInput
                                value={data.team1_player2_id}
                                onChange={(value) => setData('team1_player2_id', value)}
                                label="Player 2"
                                error={errors.team1_player2_id}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <NumberInput
                            value={data.team1_score}
                            onChange={(value) => setData('team1_score', value)}
                            min={0}
                            max={100}
                            className="w-48 text-4xl"
                        />
                    </div>
                </div>

                {/* VS */}
                <div className="text-6xl font-bold text-muted-foreground px-4 py-4 md:py-0">VS</div>

                {/* Team 2 */}
                <div className="space-y-4 w-full">
                    {team2Error && (
                        <div className="text-red-500 text-sm mb-2">{team2Error}</div>
                    )}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <PlayerInput
                                value={data.team2_player1_id}
                                onChange={(value) => setData('team2_player1_id', value)}
                                label="Player 1"
                                error={errors.team2_player1_id}
                            />
                        </div>
                        <div className="flex-1">
                            <PlayerInput
                                value={data.team2_player2_id}
                                onChange={(value) => setData('team2_player2_id', value)}
                                label="Player 2"
                                error={errors.team2_player2_id}
                            />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <NumberInput
                            value={data.team2_score}
                            onChange={(value) => setData('team2_score', value)}
                            min={0}
                            max={100}
                            className="w-48 text-4xl"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-center">
                <Button type="submit" disabled={processing} size="lg">
                    Create Game
                </Button>
            </div>
        </form>
    );
};

const ScoreboardRow: FC<{ game: Game }> = ({ game }) => {
    const team1Wins = game.team1_score > game.team2_score;
    const team2Wins = game.team2_score > game.team1_score;
    return (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-2 border-b last:border-b-0">
            <div className="flex-1 flex flex-col items-center md:items-end">
                <div className="font-semibold">
                    {game.team1_player1.name} & {game.team1_player2.name}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant={team1Wins ? 'success' : team2Wins ? 'destructive' : 'secondary'} className="text-lg px-4 py-2">
                    {game.team1_score}
                </Badge>
                <span className="text-xl font-bold text-muted-foreground">-</span>
                <Badge variant={team2Wins ? 'success' : team1Wins ? 'destructive' : 'secondary'} className="text-lg px-4 py-2">
                    {game.team2_score}
                </Badge>
            </div>
            <div className="flex-1 flex flex-col items-center md:items-start">
                <div className="font-semibold">
                    {game.team2_player1.name} & {game.team2_player2.name}
                </div>
            </div>
            <div className="hidden md:block text-sm text-muted-foreground min-w-[100px] text-center">
                {new Date(game.created_at).toLocaleDateString()}
            </div>
        </div>
    );
};

const RecentGames: FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const { data: gamesData, isLoading, error } = useQuery({
        queryKey: ['games', debouncedSearch],
        queryFn: async () => {
            const response = await fetch(route('games.index', { search: debouncedSearch }), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });
    return (
        <div className="mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-semibold">Recent Games</h2>
                <Input
                    type="search"
                    placeholder="Search by user name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>
            {isLoading ? (
                <div>Loading...</div>
            ) : error ? (
                <div>Error: {error.message}</div>
            ) : (
                <div className="divide-y">
                    {(gamesData?.data.data?.length === 0) ? (
                        <div className="text-center text-muted-foreground py-8">No games found.</div>
                    ) : (
                        gamesData?.data.data?.map((game: Game) => (
                            <ScoreboardRow key={game.id} game={game} />
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

type LeaderBoardUser = User & {
    rank: number;
    win_rate: number;
    total_games: number;
    wins: number;
    losses: number;
    score_diff: number;
}
// Leaderboard UI
const Leaderboard: FC<{ leaderboard: LeaderBoardUser[] }> = ({ leaderboard }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [search, setSearch] = useState('');

    const columns: ColumnDef<LeaderBoardUser>[] = [
        {
            accessorKey: 'rank',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Rank" />
            ),
            cell: ({ row }) => <span className="text-center block font-medium">{row.original.rank}</span>,
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'name',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Player" />
            ),
            cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'win_rate',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Win Rate" />
            ),
            cell: ({ row }) => (
                <span className="text-center block">
                    <Badge variant={row.original.win_rate >= 50 ? 'success' : 'destructive'}>
                        {row.original.win_rate}%
                    </Badge>
                </span>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'total_games',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Total Games" />
            ),
            cell: ({ row }) => <span className="text-center block">{row.original.total_games}</span>,
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'wins',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="W/L" />
            ),
            cell: ({ row }) => (
                <div className="flex flex-wrap gitems-center gap-1">
                    <span className="text-center block">
                        {row.original.wins}/{row.original.losses}
                    </span>
                    <Badge variant={row.original.wins > row.original.losses ? 'success' : row.original.wins < row.original.losses ? 'destructive' : 'secondary'}>
                        {row.original.wins - row.original.losses > 0 ? '+' : ''}{row.original.wins - row.original.losses}
                    </Badge>
                </div>
            ),
            enableSorting: true,
            enableHiding: true,
        },
        {
            accessorKey: 'score_diff',
            header: ({ column }) => (
                <DataTableColumnHeader column={column} title="Score Difference" />
            ),
            cell: ({ row }) => (
                <span className="flex justify-center">
                    <Badge variant={row.original.score_diff > 0 ? 'success' : row.original.score_diff < 0 ? 'destructive' : 'secondary'}>
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
        total_games: 'Total Games',
        wins: 'W/L',
        score_diff: 'Score Difference'
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

    useEffect(() => {
        table.getColumn('name')?.setFilterValue(search);
    }, [search]);

    return (
        <div className="mb-8">
            <div className="flex justify-between items-baseline mb-2 gap-2">
                <h2 className="text-2xl font-semibold">Player Leaderboard</h2>
                <div className="flex flex-1 justify-end flex-wrap gap-2">
                    {sorting.length > 0 && (
                        <Badge variant="outline" className="h-8">
                            {sorting.map((sort) => (
                                <span key={sort.id} className="flex items-center gap-1">
                                    {columnNames[sort.id]} {sort.desc ? '↓' : '↑'}
                                </span>
                            ))}
                            <button
                                onClick={() => setSorting([])}
                                className="ml-2 hover:bg-muted rounded-sm p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    )}
                    <Input
                        type="search"
                        placeholder="Search by player name..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="max-w-md"
                    />
                </div>
            </div>
            <DataTable table={table} />
        </div>
    );
};

type UserWithMMR = User & {
    mmr: number;
}

const TeamGenerator: FC<{ users: User[], onTeamsGenerated: (teams: { team1: User[], team2: User[] }) => void }> = ({ users, onTeamsGenerated }) => {
    const [selectedPlayers, setSelectedPlayers] = useState<User[]>([]);
    const [generatedTeams, setGeneratedTeams] = useState<{ team1: UserWithMMR[], team2: UserWithMMR[] } | null>(null);
    const { data: gamesData } = useQuery({
        queryKey: ['games'],
        queryFn: async () => {
            const response = await fetch(route('games.index'), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });

    const handleAddPlayer = (playerId: number | null) => {
        if (!playerId) return;
        if (selectedPlayers.length >= 8) return;
        if (selectedPlayers.some(p => p.id === playerId)) return;
        
        const player = users.find(u => u.id === playerId);
        if (player) {
            setSelectedPlayers(prev => [...prev, player]);
        }
    };

    const handleRemovePlayer = (playerId: number) => {
        setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
    };

    const handleGenerateTeams = () => {
        if (selectedPlayers.length < 4) return;
        const teams = generateFairTeams(selectedPlayers, gamesData?.data.data || []);
        setGeneratedTeams(teams);
        onTeamsGenerated(teams);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Select Players</h3>
                </div>
                
                <div className="flex gap-2">
                    <div className="flex-1">
                        <PlayerInput
                            value={null}
                            onChange={handleAddPlayer}
                            label="Add Player"
                        />
                    </div>
                </div>

                {selectedPlayers.length > 0 && (
                    <div className="space-y-2">
                        {selectedPlayers.map(player => (
                            <div key={player.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <span>{player.name}</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemovePlayer(player.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-center">
                <Button 
                    onClick={handleGenerateTeams}
                    disabled={selectedPlayers.length < 4}
                    size="lg"
                >
                    Generate Teams
                </Button>
            </div>

            {generatedTeams && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold">Team 1</h4>
                        <div className="space-y-2">
                            {generatedTeams.team1.map(player => (
                                <div key={player.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span>{player.name}</span>
                                    <Badge variant="outline">MMR: {player.mmr}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold">Team 2</h4>
                        <div className="space-y-2">
                            {generatedTeams.team2.map(player => (
                                <div key={player.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <span>{player.name}</span>
                                    <Badge variant="outline">MMR: {player.mmr}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function Index({ users }: Props) {
    const { search: initialSearch } = usePage().props;
    const [searchQuery, ] = useState(initialSearch || '');
    const debouncedSearch = useDebounce(searchQuery, 300);
    const [generatedTeams, setGeneratedTeams] = useState<{ team1: User[], team2: User[] } | null>(null);

    const { data: gamesData } = useQuery({
        queryKey: ['games', debouncedSearch],
        queryFn: async () => {
            const response = await fetch(route('games.index', { search: debouncedSearch }), {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        },
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Games" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="bg-white overflow-hidden">
                    <div className="space-y-12">
                        <h3 className="text-lg font-semibold">Team Generator</h3>
                        <TeamGenerator users={users} onTeamsGenerated={setGeneratedTeams} />

                        <h3 className="text-lg font-semibold">New Game</h3>
                        <NewGameForm initialTeams={generatedTeams} />

                        <Leaderboard leaderboard={gamesData?.leaderboard || []} />

                        <RecentGames />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 