import { FC, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const Statistic: FC<{ label: string; value: ReactNode, extra?: ReactNode }> = ({ label, value, extra }) => {
    return (
        <Card className={'gap-3 w-full'}>
            <CardHeader>
                <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={'text-2xl font-semibold'}>{value}</div>
                {extra ? <div className={'text-muted-foreground'}>{extra}</div> : null}
            </CardContent>
        </Card>
    );
};
