import { Minus, Plus } from 'lucide-react';
import { FC } from 'react';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';

interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    className?: string;
}

export const NumberInput: FC<NumberInputProps> = ({
    value,
    onChange,
    min = 0,
    max = 100,
    className = '',
}) => {
    const increment = () => {
        if (value < max) {
            onChange(value + 1);
        }
    };

    const decrement = () => {
        if (value > min) {
            onChange(value - 1);
        }
    };

    return (
        <InputGroup className={cn('h-auto', className)}>
            <InputGroupInput
                type="number"
                value={value}
                onChange={(e) => {
                    const newValue = parseInt(e.target.value);
                    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
                        onChange(newValue);
                    }
                }}
                min={min}
                max={max}
                className="text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <InputGroupAddon align="inline-start">
                <InputGroupButton
                    variant="outline"
                    size="icon-sm"
                    onClick={decrement}
                    disabled={value <= min}
                    aria-label="Decrease"
                >
                    <Minus />
                </InputGroupButton>
            </InputGroupAddon>
            <InputGroupAddon align="inline-end">
                <InputGroupButton
                    variant="outline"
                    size="icon-sm"
                    onClick={increment}
                    disabled={value >= max}
                    aria-label="Increase"
                >
                    <Plus />
                </InputGroupButton>
            </InputGroupAddon>
        </InputGroup>
    );
};
