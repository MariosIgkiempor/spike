import { ComponentProps, FC } from 'react';
import { cn } from '@/lib/utils';

export const SectionHeading: FC<ComponentProps<'h2'>> = ({ className, ...props }) => {
    return <h2 className={cn('text-2xl font-semibold text-gray-900 dark:text-gray-100', className)} {...props} />;
};
