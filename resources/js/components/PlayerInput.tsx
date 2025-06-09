import { User } from "@/types";
import { Label } from "./ui/label";
import { AsyncCombobox, type ComboBoxItem } from "./ui/async-combobox";

interface PlayerInputProps {
    value: number | null;
    onChange: (value: number | null) => void;
    label: string;
    error?: string;
    disabled?: boolean;
}

export function PlayerInput({ value, onChange, label, error, disabled }: PlayerInputProps) {
    const selectedItem = value ? { value, label: "" } : null;

    return (
        <div className="space-y-2">
            <Label htmlFor={label.toLowerCase()}>{label}</Label>
            <AsyncCombobox
                selectedItem={selectedItem}
                url={route('api.users.search')}
                onSelect={(item) => onChange(item.value as number)}
                searchPlaceholder="Search player..."
                disabled={disabled}
                error={error}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
} 