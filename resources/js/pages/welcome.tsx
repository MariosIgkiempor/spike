import AppLogoIcon from '@/components/app-logo-icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { format } from 'date-fns';
import { BarChart3, ChevronRight, Trophy, TrendingUp, Users } from 'lucide-react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'motion/react';
import { FC, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Mock Data
// ---------------------------------------------------------------------------

const mockLeaderboard = [
    { rank: 1, name: 'Alex T.', initials: 'AT', mmr: 1247, wins: 42, losses: 18, winRate: 0.7, streak: 5 },
    { rank: 2, name: 'Jordan K.', initials: 'JK', mmr: 1198, wins: 38, losses: 22, winRate: 0.63, streak: 3 },
    { rank: 3, name: 'Sam R.', initials: 'SR', mmr: 1156, wins: 35, losses: 25, winRate: 0.58, streak: -2 },
    { rank: 4, name: 'Casey M.', initials: 'CM', mmr: 1089, wins: 30, losses: 30, winRate: 0.5, streak: 1 },
    { rank: 5, name: 'Riley P.', initials: 'RP', mmr: 1034, wins: 28, losses: 32, winRate: 0.47, streak: -3 },
];

const features = [
    {
        icon: Trophy,
        title: 'League Tracking',
        description: 'Create leagues, invite players, and track every game with automatic score recording.',
    },
    {
        icon: TrendingUp,
        title: 'MMR Rankings',
        description: 'Elo-based ratings that adapt to win streaks, score margins, and skill gaps.',
    },
    {
        icon: Users,
        title: 'Team Generator',
        description: 'Fair or random team splits based on player MMR to keep games balanced.',
    },
    {
        icon: BarChart3,
        title: 'Game History',
        description: 'Head-to-head records, teammate synergies, win streaks, and trend charts.',
    },
];

const podiumAccents: Record<number, string> = {
    1: 'border-l-4 border-l-yellow-500/60 bg-yellow-500/[0.03]',
    2: 'border-l-4 border-l-gray-400/60 bg-gray-400/[0.03]',
    3: 'border-l-4 border-l-amber-700/60 bg-amber-700/[0.03]',
};

const medalColors: Record<number, string> = {
    1: 'text-yellow-500',
    2: 'text-gray-400',
    3: 'text-amber-700',
};

// ---------------------------------------------------------------------------
// AnimatedCounter
// ---------------------------------------------------------------------------

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    const count = useMotionValue(0);
    const rounded = useTransform(count, (v) => Math.round(v));
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (isInView) {
            animate(count, value, { duration });
        }
    }, [isInView, value]);

    useEffect(() => {
        return rounded.on('change', (v) => setDisplay(v));
    }, [rounded]);

    return <span ref={ref}>{display.toLocaleString()}</span>;
}

// ---------------------------------------------------------------------------
// MockAvatar
// ---------------------------------------------------------------------------

const MockAvatar: FC<{ initials: string; className?: string }> = ({ initials, className }) => (
    <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/25 text-sm font-bold text-primary', className)}>
        {initials}
    </div>
);

// ---------------------------------------------------------------------------
// DiagonalDivider
// ---------------------------------------------------------------------------

const DiagonalDivider: FC<{ fillClass?: string; flip?: boolean }> = ({ fillClass = 'fill-background', flip }) => (
    <div className="relative -my-px w-full overflow-hidden" aria-hidden="true">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className={cn('block h-[40px] w-full md:h-[60px]', flip && 'rotate-180')}>
            <polygon points="0,60 1440,0 1440,60" className={fillClass} />
        </svg>
    </div>
);

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen flex-col bg-background">
                {/* ── Header ───────────────────────────────────────────── */}
                <header
                    className={cn(
                        'sticky top-0 z-50 transition-[border-color,background-color] duration-300',
                        scrolled ? 'border-b border-border bg-background/90 backdrop-blur-md' : 'bg-transparent',
                    )}
                >
                    <div className="container mx-auto flex h-20 items-center px-6">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="size-10">
                                <AppLogoIcon />
                            </div>
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text font-display text-2xl tracking-wider text-transparent uppercase">
                                Spiking.me
                            </span>
                        </Link>
                        <nav className="ml-auto flex items-center gap-4">
                            {auth.user ? (
                                <Button asChild>
                                    <Link href={route('dashboard')}>Dashboard</Link>
                                </Button>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                                    >
                                        Login
                                    </Link>
                                    <Button asChild>
                                        <Link href={route('register')}>Register</Link>
                                    </Button>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="flex-1">
                    {/* ── Hero ──────────────────────────────────────────── */}
                    <section
                        className="relative w-full overflow-hidden py-20 md:py-28 lg:py-36"
                        style={{
                            background:
                                'radial-gradient(ellipse 80% 60% at 20% 40%, oklch(0.62 0.19 80 / 0.08), transparent), linear-gradient(135deg, oklch(0.62 0.19 80 / 0.05), oklch(0.62 0.22 50 / 0.05))',
                        }}
                    >
                        {/* Decorative diagonal stripe */}
                        <div
                            className="pointer-events-none absolute -right-20 top-0 h-full w-[40%] -skew-x-12 bg-gradient-to-b from-primary/[0.04] to-accent/[0.04]"
                            aria-hidden="true"
                        />

                        <div className="container relative mx-auto grid items-center gap-12 px-6 lg:grid-cols-2">
                            {/* Left — Text */}
                            <div>
                                <motion.h1
                                    className="font-display text-5xl leading-[0.95] tracking-wider uppercase sm:text-6xl lg:text-7xl xl:text-8xl"
                                    initial={{ opacity: 0, x: -40 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                                >
                                    Track Every{' '}
                                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Spike</span>
                                    <br />
                                    Dominate The Leaderboard
                                </motion.h1>

                                <motion.p
                                    className="mt-6 max-w-lg text-lg text-muted-foreground"
                                    initial={{ opacity: 0, x: -30 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2, type: 'spring', stiffness: 80, damping: 20 }}
                                >
                                    The competitive spike ball companion for leagues, rankings, and bragging rights.
                                </motion.p>

                                <motion.div
                                    className="mt-8 flex flex-wrap gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4, type: 'spring', stiffness: 80, damping: 20 }}
                                >
                                    <Button asChild size="lg" className="glow-primary gap-2">
                                        <Link href={route('register')}>
                                            Get Started
                                            <ChevronRight className="size-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg">
                                        <Link href={route('login')}>Sign In</Link>
                                    </Button>
                                </motion.div>
                            </div>

                            {/* Right — Floating Score Card */}
                            <motion.div
                                className="flex items-center justify-center"
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, type: 'spring', stiffness: 60, damping: 18 }}
                            >
                                <div className="relative">
                                    {/* Glow */}
                                    <div
                                        className="absolute -inset-8 rounded-3xl bg-gradient-to-r from-primary to-accent opacity-15 blur-3xl"
                                        aria-hidden="true"
                                    />

                                    <motion.div
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                    >
                                        <Card className="relative w-[320px] gap-4 sm:w-[360px]">
                                            <div className="h-1.5 rounded-t-xl bg-gradient-to-r from-primary via-secondary to-accent" />
                                            <CardHeader>
                                                <div className="flex items-center justify-between">
                                                    <CardTitle className="font-display text-lg tracking-wider uppercase">
                                                        Live Match
                                                    </CardTitle>
                                                    <Badge className="gap-1.5">
                                                        <span className="size-2 animate-pulse rounded-full bg-green-400" />
                                                        Live
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                {/* Team A */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex -space-x-2">
                                                            <MockAvatar initials="AT" className="ring-2 ring-card" />
                                                            <MockAvatar initials="JK" className="ring-2 ring-card" />
                                                        </div>
                                                        <span className="font-semibold">Team Alpha</span>
                                                    </div>
                                                    <span className="font-display text-3xl tracking-wider text-primary">21</span>
                                                </div>

                                                <div className="h-px bg-border" />

                                                {/* Team B */}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex -space-x-2">
                                                            <MockAvatar initials="SR" className="ring-2 ring-card" />
                                                            <MockAvatar initials="CM" className="ring-2 ring-card" />
                                                        </div>
                                                        <span className="font-semibold">Team Bravo</span>
                                                    </div>
                                                    <span className="font-display text-3xl tracking-wider text-muted-foreground">18</span>
                                                </div>

                                                <div className="h-px bg-border" />

                                                {/* MMR change */}
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">MMR Change</span>
                                                    <span className="font-semibold text-success-foreground">+24 MMR</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </section>

                    {/* ── Diagonal → Features ──────────────────────────── */}
                    <DiagonalDivider fillClass="fill-muted/30" />

                    {/* ── Features ──────────────────────────────────────── */}
                    <section className="bg-muted/30 py-20 md:py-28">
                        <div className="container mx-auto px-6">
                            <motion.div
                                className="mb-14 text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5 }}
                            >
                                <h2 className="font-display text-3xl tracking-wider uppercase sm:text-4xl lg:text-5xl">
                                    Built For Competition
                                </h2>
                                <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-primary to-accent" />
                            </motion.div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                                {features.map((feature, i) => (
                                    <motion.div
                                        key={feature.title}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-60px' }}
                                        transition={{ delay: i * 0.1, type: 'spring', stiffness: 80, damping: 20 }}
                                    >
                                        <Card className="group h-full gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                                            <div className="h-1 rounded-t-xl bg-gradient-to-r from-primary to-accent" />
                                            <CardHeader>
                                                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                                                    <feature.icon className="size-6" />
                                                </div>
                                            </CardHeader>
                                            <CardContent className="space-y-2">
                                                <h3 className="font-display text-xl tracking-wider uppercase">{feature.title}</h3>
                                                <p className="text-sm text-muted-foreground">{feature.description}</p>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── Diagonal → Leaderboard ───────────────────────── */}
                    <DiagonalDivider fillClass="fill-muted/30" flip />

                    {/* ── Leaderboard Preview ──────────────────────────── */}
                    <section className="py-20 md:py-28">
                        <div className="container mx-auto px-6">
                            <motion.div
                                className="mb-14 text-center"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5 }}
                            >
                                <h2 className="font-display text-3xl tracking-wider uppercase sm:text-4xl lg:text-5xl">See It In Action</h2>
                                <div className="mx-auto mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-primary to-accent" />
                            </motion.div>

                            {/* Mock Leaderboard Table */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5 }}
                                className="mx-auto max-w-3xl"
                            >
                                <Card>
                                    <div className="h-1 rounded-t-xl bg-gradient-to-r from-primary to-accent" />
                                    <CardHeader>
                                        <CardTitle className="font-display text-xl tracking-wider uppercase">Leaderboard</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Header row */}
                                        <div className="mb-2 grid grid-cols-[2rem_1fr_4rem_5rem_3.5rem] items-center gap-3 px-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                            <span>#</span>
                                            <span>Player</span>
                                            <span className="text-right">MMR</span>
                                            <span className="text-right">Win Rate</span>
                                            <span className="text-right">Streak</span>
                                        </div>

                                        <div className="space-y-1">
                                            {mockLeaderboard.map((player, i) => (
                                                <motion.div
                                                    key={player.rank}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    whileInView={{ opacity: 1, x: 0 }}
                                                    viewport={{ once: true, margin: '-40px' }}
                                                    transition={{ delay: i * 0.08, type: 'spring', stiffness: 100, damping: 20 }}
                                                    className={cn(
                                                        'grid grid-cols-[2rem_1fr_4rem_5rem_3.5rem] items-center gap-3 rounded-lg px-3 py-2.5',
                                                        podiumAccents[player.rank] ?? '',
                                                    )}
                                                >
                                                    <span className={cn('font-display text-lg', medalColors[player.rank] ?? '')}>
                                                        {player.rank}
                                                    </span>
                                                    <div className="flex items-center gap-2.5">
                                                        <MockAvatar initials={player.initials} className="size-8 text-xs" />
                                                        <span className="truncate font-semibold">{player.name}</span>
                                                    </div>
                                                    <span className="text-right font-display text-lg tracking-wider">
                                                        <AnimatedCounter value={player.mmr} />
                                                    </span>
                                                    <div className="flex justify-end">
                                                        <Badge variant={player.winRate >= 0.5 ? 'success' : 'destructive'}>
                                                            {Math.round(player.winRate * 100)}%
                                                        </Badge>
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            'text-right text-sm font-semibold',
                                                            player.streak > 0 ? 'text-success-foreground' : 'text-destructive-foreground',
                                                        )}
                                                    >
                                                        {player.streak > 0 ? `W${player.streak}` : `L${Math.abs(player.streak)}`}
                                                    </span>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            {/* Stat counters */}
                            <div className="mx-auto mt-14 grid max-w-2xl gap-8 sm:grid-cols-3">
                                {[
                                    { value: 1200, suffix: '+', label: 'Games Tracked' },
                                    { value: 50, suffix: '+', label: 'Active Leagues' },
                                    { value: 300, suffix: '+', label: 'Players' },
                                ].map((stat, i) => (
                                    <motion.div
                                        key={stat.label}
                                        className="text-center"
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: '-60px' }}
                                        transition={{ delay: i * 0.15, duration: 0.5 }}
                                    >
                                        <div className="bg-gradient-to-r from-primary to-accent bg-clip-text font-display text-4xl tracking-wider text-transparent md:text-5xl">
                                            <AnimatedCounter value={stat.value} />
                                            {stat.suffix}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ── CTA ──────────────────────────────────────────── */}
                    <section className="bg-gradient-to-r from-primary to-accent py-20 md:py-28">
                        <motion.div
                            className="container mx-auto px-6 text-center"
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="font-display text-4xl tracking-wider text-primary-foreground uppercase md:text-5xl lg:text-6xl">
                                Ready To Compete?
                            </h2>
                            <p className="mx-auto mt-4 max-w-md text-lg text-primary-foreground/80">
                                Create your league and start tracking in under a minute.
                            </p>
                            <div className="mt-8">
                                <Button
                                    asChild
                                    size="lg"
                                    variant="outline"
                                    className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                                >
                                    <Link href={route('register')}>Get Started Free</Link>
                                </Button>
                            </div>
                        </motion.div>
                    </section>
                </main>

                {/* ── Footer ───────────────────────────────────────────── */}
                <footer className="flex w-full shrink-0 flex-col items-center gap-2 border-t bg-background px-6 py-6 sm:flex-row">
                    <div className="flex items-center gap-2">
                        <div className="size-5">
                            <AppLogoIcon />
                        </div>
                        <p className="text-sm text-muted-foreground">&copy; {format(new Date(), 'yyyy')} Spiking.me. All rights reserved.</p>
                    </div>
                    <nav className="flex gap-4 sm:ml-auto sm:gap-6">
                        <Link href="/terms" className="text-sm underline-offset-4 hover:text-primary hover:underline">
                            Terms of Service
                        </Link>
                        <Link href="/privacy" className="text-sm underline-offset-4 hover:text-primary hover:underline">
                            Privacy Policy
                        </Link>
                        <Link href="/support" className="text-sm underline-offset-4 hover:text-primary hover:underline">
                            Support
                        </Link>
                    </nav>
                </footer>
            </div>
        </>
    );
}
