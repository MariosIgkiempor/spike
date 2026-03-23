import { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Statistic: FC<{ label: string; value: ReactNode, extra?: ReactNode }> = ({ label, value, extra }) => {
    return (
        <Card className={'gap-2 w-full relative pt-0 h-full'}>
            <div className="h-1 bg-gradient-to-r from-primary to-accent" />
            <CardHeader className="pt-4">
                <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
                <div className={'text-4xl font-display tracking-wide min-w-0 overflow-hidden'}>{value}</div>
                {extra ? <div className={'text-muted-foreground mt-auto'}>{extra}</div> : null}
            </CardContent>
        </Card>
    );
};
