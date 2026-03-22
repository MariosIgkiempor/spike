import {
    SidebarGroup,
    SidebarGroupAction,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { NewLeagueForm } from '@/features/leagues/new-league-form';
import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Plus, Trophy } from 'lucide-react';

export function NavLeagues() {
    const page = usePage<SharedData>();
    const leagues = page.props.leagues;

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className='justify-between'>
                <span>My Leagues</span>
                <Dialog>
                    <DialogTrigger asChild>
                        <SidebarGroupAction className="static">
                            <Plus />
                        </SidebarGroupAction>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New League</DialogTitle>
                        </DialogHeader>
                        <NewLeagueForm />
                    </DialogContent>
                </Dialog>
            </SidebarGroupLabel>

            <SidebarMenu>
                {leagues.map((league) => (
                    <SidebarMenuItem key={league.id}>
                        <SidebarMenuButton
                            asChild
                            isActive={page.url.startsWith(`/leagues/${league.id}`)}
                            tooltip={{ children: league.name }}
                        >
                            <Link href={route('web.leagues.show', { league: league.id })} prefetch>
                                <Trophy />
                                <span>{league.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
