import {
  MatchInningNo,
  MatchInningStatus,
  PlayerRole,
} from "../../src/generated/prisma/enums.js";
import type { ballType } from "../seed-data/balls.js";
import type { matchInning } from "../seed-data/matchInnings.js";
import generateBall, {
  getRandomByPercentage,
  type PercentageOption,
} from "./generate-ball.js";

type BowlingPlayer = {
  value: string;
  role: PlayerRole;
};

const generateBowlingPlayerPercentage = <T extends string>(
  players: {
    value: T;
    role: PlayerRole;
  }[],
): readonly PercentageOption<T>[] => {
  if (players.length === 0) {
    return [];
  }

  const bowlers = players.filter((p) => p.role === "BOWLER");
  const allRounders = players.filter((p) => p.role === "ALL_ROUNDER");
  const batsmen = players.filter((p) => p.role === "BATSMAN");

  const bowlerCount = bowlers.length;
  const allRounderCount = allRounders.length;
  const batsmanCount = batsmen.length;

  let targetBowlerShare = 70;
  let targetAllRounderShare = 25;
  let targetBatsmanShare = 5;

  if (bowlerCount === 0) {
    targetAllRounderShare += targetBowlerShare * 0.8;
    targetBatsmanShare += targetBowlerShare * 0.2;
    targetBowlerShare = 0;
  }
  if (allRounderCount === 0) {
    targetBowlerShare += targetAllRounderShare * 0.9;
    targetBatsmanShare += targetAllRounderShare * 0.1;
    targetAllRounderShare = 0;
  }
  if (batsmanCount === 0) {
    targetBowlerShare += targetBatsmanShare * 0.75;
    targetAllRounderShare += targetBatsmanShare * 0.25;
    targetBatsmanShare = 0;
  }

  const bowlerPercentage =
    bowlerCount > 0 ? Math.floor(targetBowlerShare / bowlerCount) : 0;
  const allRounderPercentage =
    allRounderCount > 0
      ? Math.floor(targetAllRounderShare / allRounderCount)
      : 0;
  const batsmanPercentage =
    batsmanCount > 0 ? Math.floor(targetBatsmanShare / batsmanCount) : 0;

  const totalAllocated =
    bowlerPercentage * bowlerCount +
    allRounderPercentage * allRounderCount +
    batsmanPercentage * batsmanCount;
  const remainingPercentage = 100 - totalAllocated;

  let remainingAdded = false;

  return players.map((player) => {
    let percentage: number;
    if (player.role === "BOWLER") {
      percentage = bowlerPercentage;
    } else if (player.role === "ALL_ROUNDER") {
      percentage = allRounderPercentage;
    } else {
      percentage = batsmanPercentage;
    }

    if (!remainingAdded && remainingPercentage > 0) {
      if (
        (bowlerCount > 0 && player.role === "BOWLER") ||
        (bowlerCount === 0 &&
          allRounderCount > 0 &&
          player.role === "ALL_ROUNDER") ||
        (bowlerCount === 0 &&
          allRounderCount === 0 &&
          player.role === "BATSMAN")
      ) {
        percentage += remainingPercentage;
        remainingAdded = true;
      }
    }

    return {
      value: player.value,
      percentage,
    };
  });
};

function generateBowlersSequence(
  overs: number,
  bowlingPlayers: BowlingPlayer[],
  maxBowlerOvers: number,
): string[] | null {
  const bowlerOversCount = new Map<string, number>();
  for (const p of bowlingPlayers) {
    bowlerOversCount.set(p.value, 0);
  }

  const sequence: string[] = [];

  function backtrack(overIdx: number): boolean {
    if (overIdx === overs) {
      return true;
    }

    const lastBowler = overIdx > 0 ? sequence[overIdx - 1] : null;

    const candidates = bowlingPlayers.filter((p) => {
      if (p.value === lastBowler) return false;
      const count = bowlerOversCount.get(p.value) ?? 0;
      return count < maxBowlerOvers;
    });

    if (candidates.length === 0) {
      return false;
    }

    const candidatePercentages = generateBowlingPlayerPercentage(candidates);

    const remainingCandidates = [...candidatePercentages] as {
      value: string;
      percentage: number;
    }[];
    while (remainingCandidates.length > 0) {
      const chosen = getRandomByPercentage(remainingCandidates);
      bowlerOversCount.set(chosen, (bowlerOversCount.get(chosen) ?? 0) + 1);
      sequence.push(chosen);

      if (backtrack(overIdx + 1)) {
        return true;
      }

      sequence.pop();
      bowlerOversCount.set(chosen, (bowlerOversCount.get(chosen) ?? 0) - 1);

      const idx = remainingCandidates.findIndex((c) => c.value === chosen);
      if (idx !== -1) {
        remainingCandidates.splice(idx, 1);
        if (remainingCandidates.length > 0) {
          const sum = remainingCandidates.reduce(
            (acc, c) => acc + c.percentage,
            0,
          );
          if (sum > 0) {
            for (const c of remainingCandidates) {
              c.percentage = (c.percentage / sum) * 100;
            }
          } else {
            const len = remainingCandidates.length;
            for (const c of remainingCandidates) {
              c.percentage = 100 / len;
            }
          }
        }
      }
    }

    return false;
  }

  if (backtrack(0)) {
    return sequence;
  }
  return null;
}

export const generateBalls = (
  matchInning: matchInning,
  battingPlayers: string[],
  bowlingPlayers: BowlingPlayer[],
  wicketKeeperMatchPlayerId: string,
  fielders: string[],
  maxBowlerOvers: number,
  startId: number,
): ballType[] => {
  if (battingPlayers.length < 2) {
    throw new Error(
      "At least 2 batting players are required to play an innings.",
    );
  }

  if (bowlingPlayers.length === 0) {
    throw new Error("At least 1 bowling player is required.");
  }

  const balls: ballType[] = [];
  const overs = matchInning.maxOvers;
  const inningId = matchInning.id;
  let newId = startId;

  const totalPossibleOvers = bowlingPlayers.length * maxBowlerOvers;

  if (totalPossibleOvers < overs) {
    throw new Error("Not enough bowling options to complete the innings.");
  }

  if (
    matchInning.inningsNo === MatchInningNo.SECOND &&
    (matchInning.target === null || matchInning.target === undefined)
  ) {
    throw new Error("Target can't be null or undefined for second innings.");
  }

  const bowlerSequence = generateBowlersSequence(
    overs,
    bowlingPlayers,
    maxBowlerOvers,
  );

  if (!bowlerSequence) {
    throw new Error(
      "Unable to generate a valid bowling rotation with the given constraints.",
    );
  }

  let isLastBallNoBall = false;
  let deliveryNo = 1;
  let strikerIndex = 0;
  let nonStrikerIndex = 1;

  let inningsRuns = 0;

  const swapStrike = () => {
    [strikerIndex, nonStrikerIndex] = [nonStrikerIndex, strikerIndex];
  };

  const getValidBall = (
    overNo: number,
    ballNo: number,
    bowlerId: string,
  ): ballType => {
    const ball: ballType = {
      ...generateBall(
        inningId,
        deliveryNo,
        overNo,
        ballNo,
        isLastBallNoBall,
        battingPlayers[strikerIndex]!,
        battingPlayers[nonStrikerIndex]!,
        bowlerId,
        wicketKeeperMatchPlayerId,
        fielders,
      ),
      id: String(newId),
    };

    if (matchInning.inningsNo !== MatchInningNo.SECOND) {
      return ball;
    }

    const requiredRuns = matchInning.target! - inningsRuns;

    if (ball.totalRuns > requiredRuns && !ball.isFour && !ball.isSix) {
      const excess = ball.totalRuns - requiredRuns;

      if (ball.batterRuns > 0) {
        ball.batterRuns = Math.max(0, ball.batterRuns - excess);
      } else if (ball.byeRuns > 0) {
        ball.byeRuns = Math.max(0, ball.byeRuns - excess);
      } else if (ball.legByeRuns > 0) {
        ball.legByeRuns = Math.max(0, ball.legByeRuns - excess);
      } else if (ball.wideRuns > 0) {
        ball.wideRuns = Math.max(1, ball.wideRuns - excess);
      }

      ball.extraRuns =
        ball.noBallRuns +
        ball.wideRuns +
        ball.penaltyRuns +
        ball.byeRuns +
        ball.legByeRuns;
      ball.totalRuns = ball.batterRuns + ball.extraRuns;
      ball.isDotBall = ball.totalRuns === 0;
    }

    return ball;
  };

  overLoop: for (let i = 0; i < overs; i++) {
    if (i > 0) {
      swapStrike();
    }
    const bowlerMatchPlayerId = bowlerSequence[i]!;

    let overBall = 1;
    while (overBall <= 6) {
      const ball = getValidBall(i, overBall, bowlerMatchPlayerId);

      balls.push(ball);
      inningsRuns += ball.totalRuns;

      if (
        matchInning.inningsNo === MatchInningNo.SECOND &&
        matchInning.target! <= inningsRuns
      ) {
        break overLoop;
      }

      newId++;
      if (ball.isLegalDelivery) {
        overBall++;
      }
      deliveryNo++;

      if (ball.isWicket) {
        const nextBatterIdx = Math.max(strikerIndex, nonStrikerIndex) + 1;
        if (ball.dismissalType === "RUN_OUT") {
          const completedRuns =
            ball.batterRuns + ball.byeRuns + ball.legByeRuns;
          if (completedRuns % 2 !== 0) {
            swapStrike();
          }
          if (ball.dismissedMatchPlayerId === battingPlayers[strikerIndex]) {
            strikerIndex = nextBatterIdx;
          } else {
            nonStrikerIndex = nextBatterIdx;
          }
        } else {
          strikerIndex = nextBatterIdx;
        }
      }

      if (
        strikerIndex >= battingPlayers.length ||
        nonStrikerIndex >= battingPlayers.length
      ) {
        break overLoop;
      }

      if (
        !ball.isWicket &&
        ball.isWide &&
        ball.wideRuns < 5 &&
        ball.wideRuns % 2 === 0
      ) {
        swapStrike();
      }

      if (
        !ball.isWicket &&
        ball.isBye &&
        ball.byeRuns < 4 &&
        ball.byeRuns % 2 === 1
      ) {
        swapStrike();
      }

      if (
        !ball.isWicket &&
        ball.isLegBye &&
        ball.legByeRuns < 4 &&
        ball.legByeRuns % 2 === 1
      ) {
        swapStrike();
      }

      if (!ball.isWicket && ball.batterRuns < 4 && ball.batterRuns % 2 === 1) {
        swapStrike();
      }

      isLastBallNoBall =
        ball.isNoBall || (isLastBallNoBall && !ball.isLegalDelivery);
    }
  }

  return balls;
};

const balls = generateBalls(
  {
    id: "401",
    matchId: "201",
    teamId: "101",
    inningsNo: MatchInningNo.FIRST,
    runs: 0,
    wickets: 0,
    balls: 0,
    maxOvers: 2,
    status: MatchInningStatus.COMPLETED,
    target: null,
  },
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
  [
    { value: "207", role: "ALL_ROUNDER" },
    { value: "208", role: "ALL_ROUNDER" },
    { value: "209", role: "BOWLER" },
    { value: "210", role: "BOWLER" },
    { value: "211", role: "BOWLER" },
  ],
  "206",
  ["201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211"],
  3,
  1001,
);

console.log(balls);
