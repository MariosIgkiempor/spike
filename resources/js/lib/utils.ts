import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function shortName(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length <= 1) return name;
    return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}`;
}
