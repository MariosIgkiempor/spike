import { ComponentProps, FC, PropsWithChildren, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PageSectionProps = PropsWithChildren<{
    title?: ReactNode;
    extra?: ReactNode;
}>;

const PageSection: FC<PageSectionProps> = ({ title, extra, children }) => {
    return <Card className={'space-y-6'}>
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
