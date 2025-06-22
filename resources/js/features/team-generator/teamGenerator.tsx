import { PlayerInput } from '@/components/PlayerInput';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { generateFairTeams } from '@/lib/mmr';
import { User } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { FC, useState } from 'react';

type UserWithMMR = User & {
    mmr: number;
};

export const TeamGenerator: FC<{
    users: User[];
    onTeamsGenerated: (teams: { team1: User[]; team2: User[] }) => void;
}> = ({ users, onTeamsGenerated }) => {
    const [selectedPlayers, setSelectedPlayers] = useState<User[]>([]);
    const [generatedTeams, setGeneratedTeams] = useState<{ team1: UserWithMMR[]; team2: UserWithMMR[] } | null>(null);
    const { data: gamesData } = useQuery({
        queryKey: ['games'],
        queryFn: async () => {
            const response = await fetch(route('games.index'), {
                headers: {
                    Accept: 'application/json',
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
        if (selectedPlayers.some((p) => p.id === playerId)) return;

        const player = users.find((u) => u.id === playerId);
        if (player) {
            setSelectedPlayers((prev) => [...prev, player]);
        }
    };

    const handleRemovePlayer = (playerId: number) => {
        setSelectedPlayers((prev) => prev.filter((p) => p.id !== playerId));
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Players</h3>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1">
                        <PlayerInput value={null} onChange={handleAddPlayer} label="Add Player" />
                    </div>
                </div>

                {selectedPlayers.length > 0 && (
                    <div className="space-y-2">
                        {selectedPlayers.map((player) => (
                            <div key={player.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                                <span className="text-gray-900 dark:text-gray-100">{player.name}</span>
                                <Button variant="ghost" size="sm" onClick={() => handleRemovePlayer(player.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex justify-center">
                <Button onClick={handleGenerateTeams} disabled={selectedPlayers.length < 4} size="lg">
                    Generate Teams
                </Button>
            </div>

            {generatedTeams && (
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team 1</h4>
                        <div className="space-y-2">
                            {generatedTeams.team1.map((player) => (
                                <div key={player.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                                    <span className="text-gray-900 dark:text-gray-100">{player.name}</span>
                                    <Badge variant="outline">MMR: {player.mmr}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Team 2</h4>
                        <div className="space-y-2">
                            {generatedTeams.team2.map((player) => (
                                <div key={player.id} className="flex items-center justify-between rounded-lg bg-muted p-3">
                                    <span className="text-gray-900 dark:text-gray-100">{player.name}</span>
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
