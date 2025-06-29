import { PageContainer } from '@/components/ui/pageContainer';
import { MyLeagues } from '@/features/leagues/my-leagues';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, League, PageProps, ResourceCollection } from '@/types';
import { Head } from '@inertiajs/react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent
} from '@/components/ui/chart';
import { PageSection } from '@/components/ui/pageSection';

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
}

export default function Dashboard({ leagues, gamesByMonth }: DashboardPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <PageContainer>
                <MyLeagues leagues={leagues.data} />
                <GamesByMonth gamesByMonth={gamesByMonth} />
            </PageContainer>
        </AppLayout>
    );
}

function GamesByMonth({ gamesByMonth }: { gamesByMonth: GamesPerMonth[] }) {
    return (
        <PageSection title={'Games by month'}>
                <ChartContainer config={{
                    played: {
                        label: 'Played',
                        color: 'var(--chart-3)'
                    },
                    won: {
                        label: 'Won',
                        color: 'var(--chart-2)'
                    },
                }} className="min-h-[200px] w-full">
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
                        <ChartLegend content={<ChartLegendContent />} />
                        <Bar dataKey="played" fill="var(--color-played)" radius={4} />
                        <Bar dataKey="won" fill="var(--color-won)" radius={4} />
                    </BarChart>
                </ChartContainer>
        </PageSection>
    );
}
