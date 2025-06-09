import { FC } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
        <div className={`flex items-center gap-2 ${className}`}>
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={decrement}
                disabled={value <= min}
            >
                -
            </Button>
            <Input
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
                className="text-center"
            />
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={increment}
                disabled={value >= max}
            >
                +
            </Button>
        </div>
    );
}; 