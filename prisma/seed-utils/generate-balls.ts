import {
  MatchInningNo,
  MatchInningStatus,
  type PlayerRole,
} from "../../src/generated/prisma/enums.js";
import type { ballType } from "../seed-data/balls.js";
import type { matchInning } from "../seed-data/matchInnings.js";
import generateBall, {
  getRandomByPercentage,
  type PercentageOption,
} from "./generate-ball.js";

type BowlingPlayer = {
  value: string;
  role: Exclude<PlayerRole, "BATSMAN">;
};

const generateBowlingPlayerPercentage = <T extends string>(
  players: {
    value: T;
    role: Exclude<PlayerRole, "BATSMAN">;
  }[],
): readonly PercentageOption<T>[] => {
  if (players.length === 0) {
    return [];
  }

  const allRounderCount = players.filter(
    (player) => player.role === "ALL_ROUNDER",
  ).length;

  const bowlerCount = players.length - allRounderCount;

  const allRounderPercentage =
    allRounderCount > 0 ? Math.floor(25 / allRounderCount) : 0;
  const bowlerPercentage = bowlerCount > 0 ? Math.floor(75 / bowlerCount) : 0;

  const remainingPercentage =
    100 -
    (allRounderPercentage * allRounderCount + bowlerPercentage * bowlerCount);

  let remainingAdded = false;

  return players.map((player) => {
    let percentage =
      player.role === "ALL_ROUNDER" ? allRounderPercentage : bowlerPercentage;

    if (
      !remainingAdded &&
      (bowlerCount > 0
        ? player.role === "BOWLER"
        : player.role === "ALL_ROUNDER") &&
      remainingPercentage > 0
    ) {
      percentage += remainingPercentage;
      remainingAdded = true;
    }

    return {
      value: player.value,
      percentage,
    };
  });
};

export const generateBalls = (
  matchInning: matchInning,
  battingPlayers: string[],
  bowlingPlayers: BowlingPlayer[],
  fielders: string[],
  maxBowlerOvers: number,
  startId: number,
): ballType[] => {
  const balls: ballType[] = [];
  const overs = matchInning.maxOvers;
  const inningId = matchInning.id;
  let newId = startId;

  const totalPossibleOvers = bowlingPlayers.length * maxBowlerOvers;

  if (totalPossibleOvers < overs) {
    throw new Error("Not enough bowling options to complete the innings.");
  }

  const bowlingPlayersWithPercentage =
    generateBowlingPlayerPercentage(bowlingPlayers);

  const bowlerOvers = new Map<string, number>();

  for (const player of bowlingPlayers) {
    bowlerOvers.set(player.value, 0);
  }

  let isLastBallNoBall = false;
  let deliveryNo = 1;
  let strikerMatchPlayerId = 0;
  let nonStrikerMatchPlayerId = 1;
  let bowlerMatchPlayerId = getRandomByPercentage(bowlingPlayersWithPercentage);

  const swapStrike = () => {
    [strikerMatchPlayerId, nonStrikerMatchPlayerId] = [
      nonStrikerMatchPlayerId,
      strikerMatchPlayerId,
    ];
  };

  overLoop: for (let i = 0; i < overs; i++) {
    if (i > 0) {
      swapStrike();

      const updatedBowlingPlayers = bowlingPlayers.filter(
        (player) =>
          player.value !== bowlerMatchPlayerId &&
          (bowlerOvers.get(player.value) ?? 0) < maxBowlerOvers,
      );

      const updatedBowlingPlayersWithPercentage =
        generateBowlingPlayerPercentage(updatedBowlingPlayers);

      bowlerMatchPlayerId = getRandomByPercentage(
        updatedBowlingPlayersWithPercentage,
      );
    }

    let overBall = 1;
    while (overBall <= 6) {
      const ball: ballType = {
        ...generateBall(
          inningId,
          deliveryNo,
          i,
          overBall,
          isLastBallNoBall,
          battingPlayers[strikerMatchPlayerId]!,
          battingPlayers[nonStrikerMatchPlayerId]!,
          bowlerMatchPlayerId,
          fielders,
        ),
        id: String(newId),
      };

      balls.push(ball);
      newId++;
      if (ball.isLegalDelivery) {
        overBall++;
      }
      deliveryNo++;

      if (ball.isWicket && ball.dismissalType !== "RUN_OUT") {
        if (strikerMatchPlayerId > nonStrikerMatchPlayerId) {
          strikerMatchPlayerId++;
        } else {
          strikerMatchPlayerId = nonStrikerMatchPlayerId + 1;
        }
      } else if (ball.dismissalType === "RUN_OUT") {
        if (ball.runOutEnd === "STRIKER_END") {
          if (
            ball.dismissedMatchPlayerId === battingPlayers[strikerMatchPlayerId]
          ) {
            if (strikerMatchPlayerId > nonStrikerMatchPlayerId) {
              strikerMatchPlayerId++;
            } else {
              strikerMatchPlayerId = nonStrikerMatchPlayerId + 1;
            }
          } else {
            if (strikerMatchPlayerId > nonStrikerMatchPlayerId) {
              nonStrikerMatchPlayerId = strikerMatchPlayerId;
              strikerMatchPlayerId++;
            } else {
              const temp = strikerMatchPlayerId;
              strikerMatchPlayerId = nonStrikerMatchPlayerId + 1;
              nonStrikerMatchPlayerId = temp;
            }
          }
        } else {
          if (
            ball.dismissedMatchPlayerId ===
            battingPlayers[nonStrikerMatchPlayerId]
          ) {
            if (strikerMatchPlayerId > nonStrikerMatchPlayerId) {
              nonStrikerMatchPlayerId = strikerMatchPlayerId + 1;
            } else {
              nonStrikerMatchPlayerId++;
            }
          } else {
            if (strikerMatchPlayerId > nonStrikerMatchPlayerId) {
              const temp = strikerMatchPlayerId;
              strikerMatchPlayerId = nonStrikerMatchPlayerId;
              nonStrikerMatchPlayerId = temp + 1;
            } else {
              strikerMatchPlayerId = nonStrikerMatchPlayerId;
              nonStrikerMatchPlayerId++;
            }
          }
        }
      }

      if (
        strikerMatchPlayerId >= battingPlayers.length ||
        nonStrikerMatchPlayerId >= battingPlayers.length
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

      isLastBallNoBall = ball.isNoBall;
    }

    bowlerOvers.set(
      bowlerMatchPlayerId,
      (bowlerOvers.get(bowlerMatchPlayerId) ?? 0) + 1,
    );
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
    maxOvers: 10,
    status: MatchInningStatus.COMPLETED,
    target: null,
  },
  ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
  [
    { value: "107", role: "ALL_ROUNDER" },
    { value: "108", role: "ALL_ROUNDER" },
    { value: "109", role: "BOWLER" },
    { value: "110", role: "BOWLER" },
    { value: "111", role: "BOWLER" },
  ],
  ["201", "202", "203", "204", "205", "206", "207", "208", "209", "210", "211"],
  3,
  1001,
);

console.log(balls);
