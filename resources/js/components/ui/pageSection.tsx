import { ComponentProps, FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type PageSectionProps = ComponentProps<typeof Card> & {
    title?: ReactNode;
    extra?: ReactNode;
};

const PageSection: FC<PageSectionProps> = ({ title, extra, children, className, ...props }) => {
    return <Card className={cn('space-y-6', className)} {...props}>
        {title ? <CardHeader>
            <div className={'flex flex-col gap-2 sm:flex-row sm:justify-between items-baseline'}>
                <PageSectionTitle>{title}</PageSectionTitle>
                {extra ? <div>{extra}</div> : null}
            </div>
        </CardHeader> : null}
        <CardContent className={'space-y-4'}>{children}</CardContent>
    </Card>;
};

const PageSectionTitle: FC<ComponentProps<typeof CardTitle>> = ({ ...props }) => {
    return <CardTitle {...props} />;
};

export {
    PageSection,
    PageSectionTitle
};
