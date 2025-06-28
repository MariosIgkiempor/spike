import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useMediaQuery } from '@/hooks/use-media-query';
import { User } from '@/types';
import { FC, useState } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';

interface PlayerInputProps {
    value: number | null;
    onChange: (value: number | null) => void;
    label: string;
    error?: string;
    disabled?: boolean;
    players: User[];
}

export const PlayerInput: FC<PlayerInputProps> = ({ players, value, onChange, label, error, disabled }) => {
    const [open, setOpen] = useState(false);
    const isDesktop = useMediaQuery('(min-width: 768px)');

    if (isDesktop) {
        return (
            <div className={'space-y-2'}>
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[150px] justify-start" disabled={disabled}>
                            {value ? <>{players.find((p) => p.id === value)!.name}</> : <>{label}</>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0" align="start">
                        <PlayerList
                            players={players}
                            setOpen={setOpen}
                            setSelectedPlayer={(user) => {
                                onChange(user?.id ?? null);
                            }}
                        />
                    </PopoverContent>
                </Popover>
                {error ? <div className={'font-semibold text-destructive-foreground'}>{error}</div> : null}
            </div>
        );
    }
    return (
        <div className={'space-y-2'}>
            <Drawer open={open} onOpenChange={setOpen}>
                <DrawerTrigger asChild>
                    <Button variant="outline" className="w-[150px] justify-start">
                        {value ? <>{players.find((p) => p.id === value)!.name}</> : <>{label}</>}
                    </Button>
                </DrawerTrigger>
                <DrawerContent>
                    <div className="mt-4 border-t">
                        <PlayerList
                            players={players}
                            setOpen={setOpen}
                            setSelectedPlayer={(user) => {
                                onChange(user?.id ?? null);
                            }}
                        />
                    </div>
                </DrawerContent>
            </Drawer>
            {error ? <div className={'font-semibold text-destructive-foreground'}>{error}</div> : null}
        </div>
    );
};

function PlayerList({
    players,
    setOpen,
    setSelectedPlayer,
}: {
    players: User[];
    setOpen: (open: boolean) => void;
    setSelectedPlayer: (player: User | null) => void;
}) {
    return (
        <Command>
            <CommandInput placeholder="Filter status..." />
            <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                    {players.map((player) => (
                        <CommandItem
                            key={player.id}
                            value={player.id.toString()}
                            onSelect={(value) => {
                                setSelectedPlayer(players.find((player) => player.id === parseInt(value)) || null);
                                setOpen(false);
                            }}
                        >
                            {player.name}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </Command>
    );
}
