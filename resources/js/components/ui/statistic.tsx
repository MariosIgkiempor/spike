import { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Statistic: FC<{ label: string; value: ReactNode, extra?: ReactNode }> = ({ label, value, extra }) => {
    return (
        <Card className={'gap-2 justify-between w-full relative'}>
            <div className="h-1 bg-gradient-to-r from-primary to-accent rounded-t-xl" />
            <CardHeader>
                <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={'text-4xl font-display tracking-wide min-w-0 overflow-hidden'}>{value}</div>
                {extra ? <div className={'text-muted-foreground'}>{extra}</div> : null}
            </CardContent>
        </Card>
    );
};
