import { Game, User } from "@/types";

type MatchHistory = {
    our_score: number;
    their_score: number;
}[]

export const calculatePlayerMMR = (matchHistory: MatchHistory, baseMMR = 1000, k = 1.5) => {
    let mmr = baseMMR;

    matchHistory.forEach(({ our_score, their_score }) => {
        const margin = Math.abs(our_score - their_score);
        const result = our_score > their_score ? 1 : 0;
        const change = k * margin;

        mmr += result === 1 ? change : -change;
    });

    return Math.round(mmr);
}

export const generateFairTeams = (players: User[], games: Game[]) => {
    const playersWithMMR = players.map(player => {
        const playerGames = games.filter(game => game.team1_player1.id === player.id || game.team1_player2.id === player.id || game.team2_player1.id === player.id || game.team2_player2.id === player.id);
        const mmr = calculatePlayerMMR(playerGames.map(game => ({ our_score: game.team1_score, their_score: game.team2_score })));
        return { ...player, mmr };
    });

    type PlayerWithMMR = typeof playersWithMMR[number];
    const combinations: { team1: [PlayerWithMMR, PlayerWithMMR], team2: [PlayerWithMMR, PlayerWithMMR] }[] = [];

    // Try every possible combination of 2v2 teams
    for (let i = 0; i < playersWithMMR.length; i++) {
        for (let j = i + 1; j < playersWithMMR.length; j++) {
            for (let k = 0; k < playersWithMMR.length; k++) {
                for (let l = k + 1; l < playersWithMMR.length; l++) {
                    // Skip if any player is used in both teams
                    if (i === k || i === l || j === k || j === l) continue;

                    combinations.push({
                        team1: [playersWithMMR[i], playersWithMMR[j]],
                        team2: [playersWithMMR[k], playersWithMMR[l]]
                    });
                }
            }
        }
    }

    // Calculate the MMR difference for each combination
    const combinationsWithMMR = combinations.map(combination => {
        const team1MMR = combination.team1.reduce((sum, player) => sum + player.mmr, 0);
        const team2MMR = combination.team2.reduce((sum, player) => sum + player.mmr, 0);
        const mmrDifference = Math.abs(team1MMR - team2MMR);

        return {
            ...combination,
            mmrDifference
        };
    });

    // Sort combinations by MMR difference and return the most balanced one
    const mostBalancedCombination = combinationsWithMMR.sort((a, b) => a.mmrDifference - b.mmrDifference)[0];

    return {
        team1: mostBalancedCombination.team1,
        team2: mostBalancedCombination.team2
    };
}