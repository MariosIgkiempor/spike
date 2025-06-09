"use client";

import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

export type ComboBoxItem = {
    value: string | number;
    label: string;
};

type AsyncComboboxProps = {
    selectedItem: ComboBoxItem | null;
    url: string;
    onSelect: (item: ComboBoxItem) => void;
    searchPlaceholder?: string;
    className?: string;
    disabled?: boolean;
    error?: string;
};

export function AsyncCombobox({
    selectedItem,
    url,
    onSelect,
    searchPlaceholder = "Search...",
    className,
    disabled = false,
    error,
}: AsyncComboboxProps) {
    const [open, setOpenState] = useState(false);
    const [search, setSearch] = useState("");
    const [selectedLabel, setSelectedLabel] = useState(selectedItem?.label || "");
    const debouncedSearch = useDebounce(search, 300);

    const { data: items = [], isLoading } = useQuery({
        queryKey: ['combobox', url, debouncedSearch],
        queryFn: async () => {
            const response = await fetch(`${url}?search=${debouncedSearch}`);
            const data = await response.json();
            
            if (selectedItem && !debouncedSearch && !data.find((i: ComboBoxItem) => i.value === selectedItem.value)) {
                data.unshift(selectedItem);
            }
            
            return data;
        },
        enabled: open,
    });

    // Update selected label when items are loaded and we have a selected item
    useEffect(() => {
        if (selectedItem && items.length > 0) {
            const foundItem = items.find((item: ComboBoxItem) => item.value === selectedItem.value);
            if (foundItem) {
                setSelectedLabel(foundItem.label);
            }
        }
    }, [items, selectedItem]);

    function setOpen(isOpen: boolean) {
        if (isOpen) {
            setSearch("");
        }
        setOpenState(isOpen);
    }

    return (
        <Popover open={open} onOpenChange={setOpen} modal={true}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "justify-between w-full",
                        error ? "border-destructive" : "",
                        className
                    )}
                    disabled={disabled}
                >
                    <span className="truncate flex items-center">
                        {selectedLabel || 'Select an item'}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                style={{ width: "var(--radix-popover-trigger-width)" }}
                className="p-0"
            >
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder={searchPlaceholder}
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {isLoading ? (
                                <div className="space-y-2 p-2">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-8 w-full" />
                                    ))}
                                </div>
                            ) : (
                                "No results found."
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {items.map((item: ComboBoxItem) => {
                                if (!item.value) {
                                    return null;
                                }
                                const isSelected = selectedItem?.value === item.value;
                                return (
                                    <CommandItem
                                        key={item.value.toString()}
                                        value={item.value.toString()}
                                        onSelect={() => {
                                            onSelect(item);
                                            setSelectedLabel(item.label);
                                            setOpen(false);
                                        }}
                                    >
                                        {item.label}
                                        <Check
                                            className={cn(
                                                "ml-auto h-4 w-4",
                                                isSelected ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
} 
