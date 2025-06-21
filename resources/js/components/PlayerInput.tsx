import { FC } from 'react';
import { AsyncCombobox } from './ui/async-combobox';
import { Label } from './ui/label';

interface PlayerInputProps {
    value: number | null;
    onChange: (value: number | null) => void;
    label: string;
    error?: string;
    disabled?: boolean;
    leagueId?: number;
}

export const PlayerInput: FC<PlayerInputProps> = ({ value, onChange, label, error, disabled, leagueId }) => {
    const selectedItem = value ? { value, label: '' } : null;

    return (
        <div className="space-y-2">
            <Label htmlFor={label.toLowerCase()}>{label}</Label>
            <AsyncCombobox
                selectedItem={selectedItem}
                url={route('api.users.search', { league: leagueId })}
                onSelect={(item) => onChange(item.value as number)}
                searchPlaceholder="Search player..."
                disabled={disabled}
                error={error}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
};
