import {
  DeadBallReason,
  DismissalType,
  NoBallReason,
  PenaltyRunReason,
  PitchEnd,
  WideReason,
} from "../../src/generated/prisma/enums";
import { generateBalls } from "../seed-utils/generate-balls.js";
import matchInnings from "./matchInnings.js";

export type ballType = {
  id: string;
  inningId: string;
  deliveryNo: number;
  overNo: number;
  ballNo: number;
  strikerMatchPlayerId: string;
  nonStrikerMatchPlayerId: string;
  bowlerMatchPlayerId: string;
  isLegalDelivery: boolean;
  isFreeHit: boolean;
  isDotBall: boolean;
  isFour: boolean;
  isSix: boolean;
  isWide: boolean;
  isNoBall: boolean;
  isBye: boolean;
  isLegBye: boolean;
  isPenalty: boolean;
  isDeadBall: boolean;
  deadBallReason: DeadBallReason;
  noBallReasons: NoBallReason[];
  wideReason: WideReason;
  penaltyRunReason: PenaltyRunReason;
  batterRuns: number;
  noBallRuns: number;
  wideRuns: number;
  byeRuns: number;
  legByeRuns: number;
  penaltyRuns: number;
  extraRuns: number;
  totalRuns: number;
  isWicket: boolean;
  dismissalType: DismissalType;
  runOutEnd: PitchEnd;
  dismissedMatchPlayerId: string;
  fielderMatchPlayerId: string;
  assistFielderMatchPlayerId: string;
};

const balls: ballType[] = generateBalls(matchInnings);

export default balls;
