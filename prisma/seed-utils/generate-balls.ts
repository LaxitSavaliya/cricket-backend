import type { ballType } from "../seed-data/balls.js";
import type { matchInning } from "../seed-data/matchInnings.js";
import type { matchPlayerType } from "../seed-data/matchPlayers.js";
import generateBall from "./generate-ball.js";

export const generateBalls = (
  matchInning: matchInning,
  battingPlayers: matchPlayerType[],
  bowlingPlayers: matchPlayerType[],
  fielders: matchPlayerType[],
): ballType[] => {
  const balls: ballType[] = [];
  const overs = matchInning.maxOvers;

  let isLastBallNoBall = false;
  let deliveryNo = 1;

  for (let i = 0; i < overs; i++) {
    for (let j = 1; j <= 6; j++) {
      const ball = generateBall(
        matchInning.id,
        deliveryNo,
        i,
        j,
        isLastBallNoBall,
        battingPlayers[0],
        battingPlayers[1],
        bowlingPlayers[i],
      );
    }
  }

  return balls;
};
