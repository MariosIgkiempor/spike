import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PageContainer } from '@/components/ui/pageContainer';
import { PageSection } from '@/components/ui/pageSection';
import { Skeleton } from '@/components/ui/skeleton';
import { MyLeagues } from '@/features/leagues/my-leagues';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, League, PageProps, ResourceCollection } from '@/types';
import { Deferred, Head, WhenVisible } from '@inertiajs/react';
import { FC, ReactNode } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

type GamesPerMonth = {
    month: string;
    played: number;
    won: number;
};

interface DashboardPageProps extends PageProps {
    leagues: ResourceCollection<League>;
    gamesByMonth: GamesPerMonth[];
    totalGames: number;
    winRate: number;
}

export default function Dashboard({ leagues, gamesByMonth, totalGames, winRate }: DashboardPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <PageContainer>
                <MyLeagues leagues={leagues.data} />
                <div className={'grid gap-6 md:grid-cols-2 lg:grid-cols-3'}>
                    <TotalGames totalGames={totalGames} />
                    <WinRate winRate={winRate} />
                </div>
                <GamesByMonth gamesByMonth={gamesByMonth} />
            </PageContainer>
        </AppLayout>
    );
}

const GamesByMonth: FC<{ gamesByMonth: GamesPerMonth[] }> = ({ gamesByMonth }) => {
    return (
        <PageSection title={'Games by month'}>
            <Deferred fallback={<Skeleton className={'h-64 w-full'} />} data={'gamesByMonth'}>
                <ChartContainer
                    config={{
                        played: {
                            label: 'Played',
                            color: 'var(--chart-3)',
                        },
                        won: {
                            label: 'Won',
                            color: 'var(--chart-2)',
                        },
                    }}
                    className="min-h-[200px] w-full"
                >
                    <BarChart accessibilityLayer data={gamesByMonth}>
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="month"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            // tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <ChartLegend content={<ChartLegendContent payload={undefined} />} />
                        <Bar dataKey="played" fill="var(--color-played)" radius={4} />
                        <Bar dataKey="won" fill="var(--color-won)" radius={4} />
                    </BarChart>
                </ChartContainer>
            </Deferred>
        </PageSection>
    );
};

const WinRate: FC<{ winRate: number }> = ({ winRate }) => {
    return (
        <WhenVisible fallback={<Skeleton className={'h-32 w-full'} />} data={'winRate'}>
            <Statistic label={'Win rate'} value={new Intl.NumberFormat('en-GB', { style: 'percent' }).format(winRate)} />
        </WhenVisible>
    );
};

const TotalGames: FC<{ totalGames: number }> = ({ totalGames }) => {
    return (
        <WhenVisible fallback={<Skeleton className={'h-32 w-full'} />} data={'totalGames'}>
            <Statistic label={'Total games'} value={totalGames} />
        </WhenVisible>
    );
};

const Statistic: FC<{ label: string; value: ReactNode }> = ({ label, value }) => {
    return (
        <Card className={'gap-3'}>
            <CardHeader>
                <CardTitle>{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className={'text-2xl font-semibold'}>{value}</div>
            </CardContent>
        </Card>
    );
};
