import { shuffleArray } from '@/lib/shuffle-array';

export type PlayerForGeneration = {
    id: string;
    mmr: number;
    total_games: number;
};

const GAMES_WEIGHT = 0.4;
const MMR_WEIGHT = 0.6;

type SplitResult = {
    diff: number;
    teamA: [string, string];
    teamB: [string, string];
};

function combinations4(n: number): [number, number, number, number][] {
    const result: [number, number, number, number][] = [];
    for (let a = 0; a < n - 3; a++) {
        for (let b = a + 1; b < n - 2; b++) {
            for (let c = b + 1; c < n - 1; c++) {
                for (let d = c + 1; d < n; d++) {
                    result.push([a, b, c, d]);
                }
            }
        }
    }
    return result;
}

function bestSplitMmrDiff(p: [PlayerForGeneration, PlayerForGeneration, PlayerForGeneration, PlayerForGeneration]): SplitResult {
    // The 3 unique ways to partition 4 players into 2v2
    const partitions: [[number, number], [number, number]][] = [
        [
            [0, 1],
            [2, 3],
        ],
        [
            [0, 2],
            [1, 3],
        ],
        [
            [0, 3],
            [1, 2],
        ],
    ];

    let best: SplitResult | null = null;
    for (const [ta, tb] of partitions) {
        const mmrA = p[ta[0]].mmr + p[ta[1]].mmr;
        const mmrB = p[tb[0]].mmr + p[tb[1]].mmr;
        const diff = Math.abs(mmrA - mmrB);
        if (best === null || diff < best.diff) {
            best = {
                diff,
                teamA: [p[ta[0]].id, p[ta[1]].id],
                teamB: [p[tb[0]].id, p[tb[1]].id],
            };
        }
    }

    return best!;
}

export function generateFairTeamsFromPool(players: PlayerForGeneration[]): [string[], string[]] {
    if (players.length < 4) {
        throw new Error('At least 4 players are required');
    }

    const combos = combinations4(players.length);

    const candidates = combos.map(([a, b, c, d]) => {
        const group: [PlayerForGeneration, PlayerForGeneration, PlayerForGeneration, PlayerForGeneration] = [
            players[a],
            players[b],
            players[c],
            players[d],
        ];
        const split = bestSplitMmrDiff(group);
        const totalGames = group.reduce((sum, p) => sum + p.total_games, 0);
        return { split, totalGames };
    });

    const maxMmrDiff = Math.max(...candidates.map((c) => c.split.diff), 1);
    const maxTotalGames = Math.max(...candidates.map((c) => c.totalGames), 1);

    const best = candidates.reduce((bestSoFar, candidate) => {
        const score = GAMES_WEIGHT * (candidate.totalGames / maxTotalGames) + MMR_WEIGHT * (candidate.split.diff / maxMmrDiff);
        const bestScore = GAMES_WEIGHT * (bestSoFar.totalGames / maxTotalGames) + MMR_WEIGHT * (bestSoFar.split.diff / maxMmrDiff);
        return score < bestScore ? candidate : bestSoFar;
    });

    return [best.split.teamA, best.split.teamB];
}

export function generateRandomTeamsFromPool(players: PlayerForGeneration[]): [string[], string[]] {
    if (players.length < 4) {
        throw new Error('At least 4 players are required');
    }

    const ids = players.map((p) => p.id);
    shuffleArray(ids);

    return [
        [ids[0], ids[1]],
        [ids[2], ids[3]],
    ];
}
