import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { FC } from 'react';

export const UserCard: FC<{ user: User }> = ({ user }) => {
    return (
        <div className={'flex w-40 items-center gap-4'}>
            <UserAvatar user={user} />
            <div>
                <div className={'font-semibold'}>{user.name}</div>
            </div>
        </div>
    );
};

export const UserAvatar: FC<{ user: User | null; className?: string }> = ({ user, className }) => {
    if (user === null) {
        return <div className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
            <span className="text-xs text-muted-foreground">?</span>
        </div>
    }

    return (
        <Avatar className={cn(className)}>
            <AvatarFallback className={'bg-primary/15 text-primary font-semibold'}>
                {user.name
                    .split(' ')
                    .map((n) => n.charAt(0))
                    .join('')}
            </AvatarFallback>
        </Avatar>
    );
};
