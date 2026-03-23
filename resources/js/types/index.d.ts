import type { Config } from 'ziggy-js';

export interface Auth {
    user: User;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: string;
    icon?: React.ComponentType;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    ziggy: Config & { location: string };
    sidebarOpen: boolean;
    leagues: { id: string; name: string }[];

    [key: string]: unknown;
}

export interface User {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
    email_verified_at: string;
    has_password: boolean;
}

export interface PageProps {
    auth: {
        user: User;
    };
    ziggy: {
        location: string;
    };
    errors: Record<string, string>;
}

export interface Team {
    id: string;
    players: User[];
    score: number;
    won: boolean;
}

export interface Game {
    id: string;
    teams: Team[];
    scores: number[];
    createdAt: string;
    updatedAt: string;
}

export interface Season {
    id: string;
    number: number;
    customName: string | null;
    displayName: string;
    isActive: boolean;
    startedAt: string;
    endedAt: string | null;
}

export interface League {
    id: string;
    name: string;
    games: Game[];
    players: User[];
    owner: User;
    currentSeason: Season | null;
    seasons: Season[];
}

export interface Paginated<T> {
    data: T[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
}

export interface Resource<T> {
    data: T;
}

export interface ResourceCollection<T> {
    data: T[];
}
