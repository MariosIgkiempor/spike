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
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string;
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
    id: number;
    name: string;
}

export interface Game {
    id: number;
    team1_player1: User;
    team1_player2: User;
    team2_player1: User;
    team2_player2: User;
    team1_score: number;
    team2_score: number;
    created_at: string;
}
