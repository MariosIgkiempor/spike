'use client';

import * as React from 'react';
import { FC } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type DatePickerProps = {
    value?: Date;
    onChange?: (value?: Date) => void;
}

export const DatePicker: FC<DatePickerProps> = ({ value, onChange }) => {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    data-empty={!value}
                    className="data-[empty=true]:text-muted-foreground w-[280px] justify-start text-left font-normal"
                >
                    <CalendarIcon />
                    {value ? format(value, 'PPP') : <span>Pick a date</span>}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={value} onSelect={onChange} />
            </PopoverContent>
        </Popover>
    );
};
