import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LeaderboardUser } from '@/features/leaderboard/leaderboard-table';
import { UserAvatar } from '@/features/users/user-card';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { ChevronsUpDown } from 'lucide-react';
import { FC, useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

interface PlayerInputProps {
    value: string | null;
    onChange: (value: string | null) => void;
    label: string;
    error?: string;
    disabled?: boolean;
    players: User[];
    leaderboard?: LeaderboardUser[];
    keepOpen?: boolean;
    mirrored?: boolean;
    disabledPlayerIds?: string[];
}

const PlayerTrigger: FC<{ player: User | null; leaderboardUser: LeaderboardUser | null; label: string; mirrored: boolean }> = ({
    player,
    leaderboardUser,
    label,
    mirrored,
}) => {
    return (
        <div className={cn('flex w-full items-center gap-2.5', mirrored && 'flex-row-reverse')}>
            <UserAvatar user={player} />
            <div className={cn('min-w-0 flex-1 text-left', mirrored && 'text-right')}>
                <div className="truncate text-sm font-semibold">{player ? player.name : label}</div>
                {leaderboardUser && (
                    <div className="text-sm text-muted-foreground">
                        {leaderboardUser.mmr} MMR &middot; {leaderboardUser.total_games} games
                    </div>
                )}
            </div>
            <ChevronsUpDown className="size-3.5 shrink-0 text-muted-foreground/50" />
        </div>
    );
};

export const PlayerInput: FC<PlayerInputProps> = ({
    players,
    value,
    onChange,
    label,
    error,
    disabled,
    leaderboard = [],
    keepOpen = false,
    mirrored = false,
    disabledPlayerIds = [],
}) => {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    const selectedPlayer = value ? (players.find((p) => p.id === value) ?? null) : null;
    const selectedLeaderboardUser = value ? (leaderboard.find((u) => u.id === value) ?? null) : null;

    const handleSelect = (user: User | null) => {
        onChange(user?.id ?? null);
        if (!keepOpen) {
            setOpen(false);
        }
    };

    const trigger = (
        <button
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
                'flex h-auto w-full items-center rounded-md border border-input bg-background px-3 py-2 shadow-xs transition-colors hover:bg-accent/50 [&:hover_[data-slot=avatar-fallback]]:bg-accent-foreground/15 [&:hover_[data-slot=avatar-fallback]]:text-accent-foreground',
                'focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-[3px]',
                'disabled:cursor-not-allowed disabled:opacity-50',
            )}
        >
            <PlayerTrigger player={selectedPlayer} leaderboardUser={selectedLeaderboardUser} label={label} mirrored={mirrored} />
        </button>
    );

    if (isDesktop) {
        return (
            <div className="space-y-2">
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>{trigger}</PopoverTrigger>
                    <PopoverContent className="p-0" align="start" alignOffset={80}>
                        <PlayerList players={players} leaderboard={leaderboard} disabledPlayerIds={disabledPlayerIds} setSelectedPlayer={handleSelect} />
                    </PopoverContent>
                </Popover>
                {error ? <div className="font-semibold text-destructive-foreground">{error}</div> : null}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>{trigger}</DrawerTrigger>
                <DrawerContent>
                    <div className="mt-4 border-t">
                        <PlayerList players={players} leaderboard={leaderboard} disabledPlayerIds={disabledPlayerIds} setSelectedPlayer={handleSelect} />
                    </div>
                </DrawerContent>
            </Drawer>
            {error ? <div className="font-semibold text-destructive-foreground">{error}</div> : null}
        </div>
    );
};

function PlayerList({
    players,
    leaderboard = [],
    disabledPlayerIds = [],
    setSelectedPlayer,
}: {
    players: User[];
    leaderboard?: LeaderboardUser[];
    disabledPlayerIds?: string[];
    setSelectedPlayer: (player: User | null) => void;
}) {
    return (
        <Command>
            <CommandInput placeholder="Search players..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                    {players.map((player) => {
                        const lb = leaderboard.find((u) => u.id === player.id);
                        return (
                            <CommandItem
                                key={player.id}
                                value={`${player.id}::${player.name}`}
                                disabled={disabledPlayerIds.includes(player.id)}
                                onSelect={(value) => {
                                    const id = value.split('::')[0];
                                    setSelectedPlayer(players.find((p) => p.id === id) || null);
                                }}
                                className="flex items-center gap-2.5 py-2 data-[selected=true]:[&_[data-slot=avatar-fallback]]:bg-accent-foreground/15 data-[selected=true]:[&_[data-slot=avatar-fallback]]:text-accent-foreground"
                            >
                                <UserAvatar user={player} size="sm" />
                                <span className="flex-1 truncate font-medium">{player.name}</span>
                                {lb && (
                                    <span className="shrink-0 text-sm opacity-70">
                                        {lb.mmr} MMR &middot; {lb.total_games} games
                                    </span>
                                )}
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
