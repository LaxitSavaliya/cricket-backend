import {
  MatchInningNo,
  MatchInningStatus,
  TossDecision,
} from "../../src/generated/prisma/enums.js";
import type { matchType } from "../seed-data/matches.js";
import type { matchInning } from "../seed-data/matchInnings.js";
import type { matchPlayerType } from "../seed-data/matchPlayers.js";
import players from "../seed-data/players.js";
import { generateBalls } from "./generate-balls.js";

export const getMatchDataForMatch = (
  matches: matchType[],
  matchPlayers: matchPlayerType[],
) => {
  const matchInningsData: matchInning[] = [];
  const matchPlayersData: matchPlayerType[] = [];
  const ballsData = [];

  const getMatchTarget = (matchId: string): number | null => {
    const firstInning = matchInningsData.find(
      (inning) =>
        inning.matchId === matchId && inning.inningsNo === MatchInningNo.FIRST,
    );
    return firstInning ? firstInning.runs + 1 : null;
  };

  let matchInningIdStart = 401;

  for (const match of matches) {
    for (let i = 1; i <= 2; i++) {
      const tossWinnerBats = match.tossDecision === TossDecision.BAT;

      const firstInningsBattingTeamId = tossWinnerBats
        ? match.tossWinnerTeamId
        : match.tossWinnerTeamId === match.homeTeamId
          ? match.awayTeamId
          : match.homeTeamId;

      const battingTeamId =
        i === 1
          ? firstInningsBattingTeamId
          : firstInningsBattingTeamId === match.homeTeamId
            ? match.awayTeamId
            : match.homeTeamId;

      const matchInning: matchInning = {
        id: matchInningIdStart.toString(),
        matchId: match.id,
        teamId: battingTeamId!,
        inningsNo: i === 1 ? MatchInningNo.FIRST : MatchInningNo.SECOND,
        runs: 0,
        wickets: 0,
        balls: 0,
        maxOvers: 10,
        status: MatchInningStatus.COMPLETED,
        target: i === 1 ? null : getMatchTarget(match.id),
      };

      const battingPlayerIds = matchPlayers
        .filter(
          (player) =>
            player.isPlaying &&
            player.matchId === match.id &&
            player.teamId === battingTeamId,
        )
        .map((player) => player.id);

      const playerRoleMap = new Map(
        players.map((player) => [player.id, player.role]),
      );

      const playerCanKeepWicketsMap = new Map(
        players.map((player) => [player.id, player.canKeepWickets]),
      );

      const result = matchPlayers
        .filter(
          (player) =>
            player.isPlaying &&
            player.matchId === match.id &&
            player.teamId !== battingTeamId,
        )
        .map((matchPlayer) => ({
          value: matchPlayer.id,
          role: playerRoleMap.get(matchPlayer.playerId)!,
        }));

      const bowlers = result.filter((player) => player.role === "BOWLER");

      const allRounders = result.filter(
        (player) => player.role === "ALL_ROUNDER",
      );

      const others = result.filter(
        (player) => player.role !== "BOWLER" && player.role !== "ALL_ROUNDER",
      );

      const bowlingPlayers = [...bowlers, ...allRounders, ...others].slice(
        0,
        5,
      );

      const wicketKeeperMatchPlayer = matchPlayers
        .filter(
          (player) =>
            player.isPlaying &&
            player.matchId === match.id &&
            player.teamId === battingTeamId,
        )
        .find((player) => playerCanKeepWicketsMap.get(player.playerId));

      const fielders = result.map((player) => player.value);

      const matchInningBalls = generateBalls(
        matchInning,
        battingPlayerIds,
        bowlingPlayers,
        wicketKeeperMatchPlayer!.id,
        fielders,
        3,
        501,
      );

      ballsData.push(...matchInningBalls);

      const totalRuns = matchInningBalls.reduce(
        (acc, ball) => acc + ball.totalRuns,
        0,
      );

      const totalWickets = matchInningBalls.reduce(
        (acc, ball) => acc + (ball.isWicket ? 1 : 0),
        0,
      );

      const latestBall = matchInningBalls.reduce((latest, current) => {
        if (current.overNo > latest.overNo) return current;

        if (
          current.overNo === latest.overNo &&
          current.ballNo > latest.ballNo
        ) {
          return current;
        }

        return latest;
      });

      const totalBalls = latestBall.overNo * 6 + latestBall.ballNo;

      matchInning.runs = totalRuns;
      matchInning.wickets = totalWickets;
      matchInning.balls = totalBalls;

      matchInningsData.push(matchInning);
      matchInningIdStart++;
    }
  }

  return {
    matchInningsData,
    matchPlayersData,
    ballsData,
  };
};
