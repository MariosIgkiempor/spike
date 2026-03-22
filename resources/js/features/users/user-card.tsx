import { User } from '@/types';
import { FC } from 'react';
import { UserAvatar } from './user-avatar';

export { UserAvatar } from './user-avatar';

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
