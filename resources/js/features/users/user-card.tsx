import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from '@/types';
import { FC } from 'react';

export const UserCard: FC<{ user: User }> = ({ user }) => {
    return (
        <div className={'flex w-40 gap-4'}>
            <UserAvatar user={user} />
            <div>
                <div className={'font-semibold'}>{user.name}</div>
            </div>
        </div>
    );
};

export const UserAvatar: FC<{ user: User }> = ({ user }) => {
    return (
        <Avatar className={'rounded-none'}>
            <AvatarFallback className={'rounded-none bg-muted-foreground text-muted'}>
                {user.name
                    .split(' ')
                    .map((n) => n.charAt(0))
                    .join('')}
            </AvatarFallback>
        </Avatar>
    );
};
