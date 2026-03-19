import { ComponentProps, FC } from 'react';
import { cn } from '@/lib/utils';

export const SectionHeading: FC<ComponentProps<'h2'>> = ({ className, ...props }) => {
    return <h2 className={cn('text-3xl font-display tracking-wide uppercase text-foreground', className)} {...props} />;
};
