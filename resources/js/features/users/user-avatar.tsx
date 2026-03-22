import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { User } from '@/types';
import { cva, type VariantProps } from 'class-variance-authority';
import { FC } from 'react';

const avatarVariants = cva('', {
    variants: {
        size: {
            xs: 'size-6',
            sm: 'size-7',
            md: 'size-8',
            lg: 'size-9',
            xl: 'size-11',
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

const fallbackVariants = cva('font-bold', {
    variants: {
        variant: {
            default: 'bg-primary/25 text-primary-foreground',
            success: 'bg-success text-success-foreground',
            muted: 'bg-muted text-muted-foreground',
        },
        size: {
            xs: 'text-[10px]',
            sm: 'text-xs',
            md: 'text-xs',
            lg: 'text-sm',
            xl: 'text-sm',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'md',
    },
});

function getInitials(name: string): string {
    const parts = name.trim().split(' ');
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

interface UserAvatarProps extends VariantProps<typeof avatarVariants>, VariantProps<typeof fallbackVariants> {
    user: User | null;
    className?: string;
}

export const UserAvatar: FC<UserAvatarProps> = ({ user, size, variant, className }) => {
    if (user === null) {
        return (
            <div
                className={cn(
                    'flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30',
                    avatarVariants({ size }),
                    className,
                )}
            >
                <span className={cn('text-muted-foreground', fallbackVariants({ size, variant: 'muted' }))}>?</span>
            </div>
        );
    }

    return (
        <Avatar className={cn(avatarVariants({ size }), className)}>
            <AvatarFallback className={fallbackVariants({ variant, size })}>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
    );
};

export { avatarVariants, fallbackVariants };
