import {
  DeadBallReason,
  DismissalType,
  NoBallReason,
  PenaltyRunReason,
  PitchEnd,
  WideReason,
} from "../../src/generated/prisma/enums.js";

export type PercentageOption<T extends string> = {
  readonly value: T;
  readonly percentage: number;
};

export type RandomSource = () => number;

export function getRandomByPercentage<T extends string>(
  options: readonly PercentageOption<T>[],
  random: RandomSource = Math.random,
): T {
  if (options.length === 0) {
    throw new Error("Options array cannot be empty.");
  }

  let totalPercentage = 0;

  for (const option of options) {
    const { value, percentage } = option;

    if (!Number.isFinite(percentage)) {
      throw new TypeError(`Percentage for "${value}" must be a finite number.`);
    }

    if (percentage < 0) {
      throw new RangeError(`Percentage for "${value}" cannot be negative.`);
    }

    totalPercentage += percentage;
  }

  const tolerance = 0.000001;

  if (Math.abs(totalPercentage - 100) > tolerance) {
    throw new RangeError(
      `Percentages must total 100. Current total: ${totalPercentage}`,
    );
  }

  const randomValue = random();

  if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
    throw new RangeError(
      `Random source must return a finite number from 0 inclusive to 1 exclusive. Received: ${randomValue}`,
    );
  }

  const randomNumber = randomValue * 100;
  let cumulativePercentage = 0;

  for (const option of options) {
    cumulativePercentage += option.percentage;

    if (randomNumber < cumulativePercentage) {
      return option.value;
    }
  }

  // Only reachable because of floating-point precision.
  const fallback = options[options.length - 1];
  if (!fallback) {
    throw new Error("Options array cannot be empty.");
  }
  return fallback.value;
}

function createEqualPercentageOptions<T extends string>(
  values: readonly T[],
): PercentageOption<T>[] {
  if (values.length === 0) {
    throw new Error("Values array cannot be empty.");
  }

  const totalUnits = 10_000; // 100.00% represented as hundredths
  const baseUnits = Math.floor(totalUnits / values.length);
  const remainderUnits = totalUnits - baseUnits * values.length;

  return values.map((value, index) => ({
    value,
    percentage: (baseUnits + (index < remainderUnits ? 1 : 0)) / 100,
  }));
}

type BowledType = "LEGAL" | "WIDE" | "NO_BALL";
type ContactType =
  | "BAT_CONTACT"
  // In this seed generator, BODY_CONTACT only represents
  // body contact where any completed runs are Leg-byes.
  | "BODY_CONTACT"
  | "NO_CONTACT";
type BatRunOutcome =
  "DOT" | "SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR" | "SIX" | "WICKET";
type RunOutPlayer = "STRIKER" | "NON_STRIKER";
type AssistPossibility = "ASSIST" | "NO_ASSIST";
type ObstructionScenario = "PREVENTING_CATCH" | "OTHER_OBSTRUCTION";

const obstructionScenarios = [
  {
    value: "PREVENTING_CATCH",
    percentage: 20,
  },
  {
    value: "OTHER_OBSTRUCTION",
    percentage: 80,
  },
] as const satisfies readonly PercentageOption<ObstructionScenario>[];

const bowledTypes = [
  {
    value: "LEGAL",
    percentage: 95,
  },
  {
    value: "WIDE",
    percentage: 4,
  },
  {
    value: "NO_BALL",
    percentage: 1,
  },
] as const satisfies readonly PercentageOption<BowledType>[];

const legalAndNoBallContactTypes = [
  { value: "BAT_CONTACT", percentage: 78 },
  { value: "BODY_CONTACT", percentage: 7 },
  { value: "NO_CONTACT", percentage: 15 },
] as const satisfies readonly PercentageOption<ContactType>[];

const wideBallContactTypes = [
  { value: "NO_CONTACT", percentage: 100 },
] as const satisfies readonly PercentageOption<ContactType>[];

const batRunOutcomes = [
  { value: "DOT", percentage: 20 },
  { value: "SINGLE", percentage: 25 },
  { value: "DOUBLE", percentage: 7 },
  { value: "TRIPLE", percentage: 0.5 },
  { value: "FOUR", percentage: 23 },
  { value: "SIX", percentage: 18 },
  { value: "WICKET", percentage: 6.5 },
] as const satisfies readonly PercentageOption<BatRunOutcome>[];

const freeHitBatContactOutcomes = [
  { value: "DOT", percentage: 20 },
  { value: "SINGLE", percentage: 20 },
  { value: "DOUBLE", percentage: 8 },
  { value: "TRIPLE", percentage: 1 },
  { value: "FOUR", percentage: 25 },
  { value: "SIX", percentage: 25 },
  { value: "WICKET", percentage: 1 },
] as const satisfies readonly PercentageOption<BatRunOutcome>[];

const runOutcomes = [
  { value: "DOT", percentage: 80 },
  { value: "SINGLE", percentage: 14 },
  { value: "DOUBLE", percentage: 3 },
  { value: "TRIPLE", percentage: 0.5 },
  { value: "FOUR", percentage: 1.5 },
  { value: "WICKET", percentage: 1 },
] as const satisfies readonly PercentageOption<Exclude<BatRunOutcome, "SIX">>[];

const runOutBeforeTakenRuns = [
  { value: "DOT", percentage: 85 },
  { value: "SINGLE", percentage: 12 },
  { value: "DOUBLE", percentage: 2.5 },
  { value: "TRIPLE", percentage: 0.5 },
] as const satisfies readonly PercentageOption<
  Exclude<BatRunOutcome, "FOUR" | "SIX" | "WICKET">
>[];

const invalidFreeHitDismissalRunOutcomes = [
  { value: "DOT", percentage: 70 },
  { value: "SINGLE", percentage: 22 },
  { value: "DOUBLE", percentage: 6 },
  { value: "TRIPLE", percentage: 1 },
  { value: "FOUR", percentage: 1 },
] as const satisfies readonly PercentageOption<
  Exclude<BatRunOutcome, "SIX" | "WICKET">
>[];

const batContactWicketOutcomes = [
  { value: "CAUGHT", percentage: 60 },
  { value: "BOWLED", percentage: 15 },
  { value: "RUN_OUT", percentage: 10 },
  { value: "STUMPED", percentage: 7 },
  { value: "HIT_WICKET", percentage: 5 },
  { value: "HIT_BALL_TWICE", percentage: 2 },
  { value: "OBSTRUCTING_FIELD", percentage: 1 },
] as const satisfies readonly PercentageOption<DismissalType>[];

const bodyContactWicketOutcomes = [
  { value: "LBW", percentage: 75 },
  { value: "RUN_OUT", percentage: 15 },
  { value: "HIT_WICKET", percentage: 7 },
  { value: "OBSTRUCTING_FIELD", percentage: 3 },
] as const satisfies readonly PercentageOption<DismissalType>[];

const noContactWicketOutcomes = [
  { value: "BOWLED", percentage: 55 },
  { value: "STUMPED", percentage: 20 },
  { value: "RUN_OUT", percentage: 15 },
  { value: "HIT_WICKET", percentage: 8 },
  { value: "OBSTRUCTING_FIELD", percentage: 2 },
] as const satisfies readonly PercentageOption<DismissalType>[];

const wideWicketOutcomes = [
  { value: "STUMPED", percentage: 51 },
  { value: "RUN_OUT", percentage: 40 },
  { value: "HIT_WICKET", percentage: 9 },
] as const satisfies readonly PercentageOption<DismissalType>[];

const noBallBatContactWicketOutcomes = [
  { value: "RUN_OUT", percentage: 90 },
  { value: "HIT_BALL_TWICE", percentage: 5 },
  { value: "OBSTRUCTING_FIELD", percentage: 5 },
] as const satisfies readonly PercentageOption<DismissalType>[];

const noBallNonBatContactWicketOutcomes = [
  { value: "RUN_OUT", percentage: 95 },
  { value: "OBSTRUCTING_FIELD", percentage: 5 },
] as const satisfies readonly PercentageOption<DismissalType>[];

const runOutPlayers = [
  { value: "STRIKER", percentage: 50 },
  { value: "NON_STRIKER", percentage: 50 },
] as const satisfies readonly PercentageOption<RunOutPlayer>[];

const caughtAssistPossibilities = [
  { value: "ASSIST", percentage: 1 },
  { value: "NO_ASSIST", percentage: 99 },
] as const satisfies readonly PercentageOption<AssistPossibility>[];

const runOutAssistPossibilities = [
  { value: "ASSIST", percentage: 70 },
  { value: "NO_ASSIST", percentage: 30 },
] as const satisfies readonly PercentageOption<AssistPossibility>[];

const wideReasons = [
  { value: "OUTSIDE_OFF", percentage: 33 },
  { value: "DOWN_LEG", percentage: 33 },
  { value: "TOO_FAR_FROM_BATTER", percentage: 33 },
  { value: "OTHER", percentage: 1 },
] as const satisfies readonly PercentageOption<WideReason>[];

const noBallReasons = [
  { value: "OVERSTEP", percentage: 55 },
  { value: "BACK_FOOT_FAULT", percentage: 5 },
  { value: "HIGH_FULL_TOSS", percentage: 12 },
  { value: "TOO_MANY_BOUNCERS", percentage: 7 },
  { value: "BOUNCER_OVER_HEAD", percentage: 5 },
  { value: "DANGEROUS_BOWLING", percentage: 3 },
  { value: "BOUNCES_MORE_THAN_ONCE", percentage: 2 },
  { value: "ROLLING_BALL", percentage: 1 },
  { value: "PITCHED_OFF_PITCH", percentage: 1 },
  { value: "BALL_COMES_TO_REST", percentage: 0.5 },
  { value: "BOWLER_BREAKS_WICKET", percentage: 1 },
  { value: "FIELDER_INTERCEPTS_DELIVERY", percentage: 0.2 },
  { value: "WICKET_KEEPER_POSITION", percentage: 1 },
  { value: "FIELDING_RESTRICTION", percentage: 4 },
  { value: "ILLEGAL_ACTION", percentage: 0.2 },
  { value: "UNDERARM", percentage: 0.1 },
  { value: "OTHER", percentage: 2 },
] as const satisfies readonly PercentageOption<NoBallReason>[];

const immediateDeadBallReasonByNoBallReason: Partial<
  Record<NoBallReason, DeadBallReason>
> = {
  [NoBallReason.BALL_COMES_TO_REST]:
    DeadBallReason.BALL_COMES_TO_REST_BEFORE_STRIKER,

  [NoBallReason.FIELDER_INTERCEPTS_DELIVERY]:
    DeadBallReason.FIELDER_INTERCEPTS_DELIVERY,
};

const freeHitNotOutReasons: readonly DismissalType[] = [
  "BOWLED",
  "CAUGHT",
  "LBW",
  "STUMPED",
  "HIT_WICKET",
];

export interface GeneratedBall {
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
  deadBallReason: DeadBallReason | null;
  noBallReasons: NoBallReason[];
  wideReason: WideReason | null;
  penaltyRunReason: PenaltyRunReason | null;
  batterRuns: number;
  noBallRuns: number;
  wideRuns: number;
  byeRuns: number;
  legByeRuns: number;
  penaltyRuns: number;
  extraRuns: number;
  totalRuns: number;
  isWicket: boolean;
  dismissalType: DismissalType | null;
  runOutEnd: PitchEnd | null;
  dismissedMatchPlayerId: string | null;
  fielderMatchPlayerId: string | null;
  assistFielderMatchPlayerId: string | null;
}

const dismissalTypesWithoutFielder = new Set<DismissalType>([
  "BOWLED",
  "LBW",
  "HIT_WICKET",
  "HIT_BALL_TWICE",
  "OBSTRUCTING_FIELD",
]);

function assertGeneratedBallConsistency(ball: GeneratedBall): void {
  const calculatedExtraRuns =
    ball.noBallRuns +
    ball.wideRuns +
    ball.byeRuns +
    ball.legByeRuns +
    ball.penaltyRuns;

  const calculatedTotalRuns = ball.batterRuns + calculatedExtraRuns;

  if (
    ball.dismissalType &&
    dismissalTypesWithoutFielder.has(ball.dismissalType) &&
    (ball.fielderMatchPlayerId !== null ||
      ball.assistFielderMatchPlayerId !== null)
  ) {
    throw new Error(
      `${ball.dismissalType} cannot contain fielder information.`,
    );
  }

  if (!ball.isWide) {
    if (ball.wideRuns !== 0) {
      throw new Error("A non-Wide delivery cannot contain Wide runs.");
    }

    if (ball.wideReason !== null) {
      throw new Error("A non-Wide delivery cannot contain wideReason.");
    }
  }

  if (!ball.isNoBall) {
    if (ball.noBallRuns !== 0) {
      throw new Error("A non-No-ball delivery cannot contain No-ball runs.");
    }

    if (ball.noBallReasons.length !== 0) {
      throw new Error("A non-No-ball delivery cannot contain No-ball reasons.");
    }
  }

  const hasByeRuns = ball.byeRuns > 0;
  const hasLegByeRuns = ball.legByeRuns > 0;
  const hasPenaltyRuns = ball.penaltyRuns > 0;

  if (ball.isBye !== hasByeRuns) {
    throw new Error("isBye must match byeRuns.");
  }

  if (ball.isLegBye !== hasLegByeRuns) {
    throw new Error("isLegBye must match legByeRuns.");
  }

  if (ball.isPenalty !== hasPenaltyRuns) {
    throw new Error("isPenalty must match penaltyRuns.");
  }

  if (ball.isFour && ball.isSix) {
    throw new Error("A delivery cannot be both a batter four and batter six.");
  }

  if (ball.isLegalDelivery && (ball.isWide || ball.isNoBall)) {
    throw new Error("A Wide or No-ball cannot be a legal delivery.");
  }

  if (ball.extraRuns !== calculatedExtraRuns) {
    throw new Error(
      `Invalid extraRuns. Expected ${calculatedExtraRuns}, received ${ball.extraRuns}.`,
    );
  }

  if (ball.totalRuns !== calculatedTotalRuns) {
    throw new Error(
      `Invalid totalRuns. Expected ${calculatedTotalRuns}, received ${ball.totalRuns}.`,
    );
  }

  if (ball.isWide && ball.isNoBall) {
    throw new Error("A delivery cannot be both Wide and No-ball.");
  }

  if (ball.isWicket !== (ball.dismissalType !== null)) {
    throw new Error("isWicket must match whether dismissalType is present.");
  }

  if (!ball.isWicket) {
    if (ball.dismissedMatchPlayerId !== null) {
      throw new Error("A non-wicket delivery cannot have a dismissed player.");
    }

    if (ball.runOutEnd !== null) {
      throw new Error("A non-wicket delivery cannot have runOutEnd.");
    }

    if (
      ball.fielderMatchPlayerId !== null ||
      ball.assistFielderMatchPlayerId !== null
    ) {
      throw new Error(
        "A non-wicket delivery cannot contain fielder information.",
      );
    }
  }

  if (ball.dismissalType === "RUN_OUT") {
    if (!ball.dismissedMatchPlayerId) {
      throw new Error("Run-out must have a dismissed player.");
    }

    if (!ball.runOutEnd) {
      throw new Error("Run-out must have a run-out end.");
    }

    if (!ball.fielderMatchPlayerId) {
      throw new Error("Run-out must have a primary fielder.");
    }
  } else if (ball.runOutEnd !== null) {
    throw new Error("runOutEnd must only be present for a run-out.");
  }

  if (ball.dismissalType === "CAUGHT" && !ball.fielderMatchPlayerId) {
    throw new Error("Caught dismissal must have a fielder.");
  }

  if (ball.dismissalType === "STUMPED" && !ball.fielderMatchPlayerId) {
    throw new Error("Stumped dismissal must have a wicketkeeper.");
  }

  if (
    ball.assistFielderMatchPlayerId &&
    ball.assistFielderMatchPlayerId === ball.fielderMatchPlayerId
  ) {
    throw new Error("Primary and assist fielders must be different.");
  }

  if (ball.isWide) {
    if (ball.wideRuns < 1) {
      throw new Error("Wide delivery must contain at least one Wide run.");
    }

    if (ball.batterRuns !== 0) {
      throw new Error("A Wide cannot contain batter runs.");
    }

    if (ball.byeRuns !== 0 || ball.legByeRuns !== 0) {
      throw new Error("Wide runs cannot also be Byes or Leg-byes.");
    }

    if (!ball.wideReason) {
      throw new Error("Wide delivery must contain a wideReason.");
    }
  }

  if (ball.isNoBall) {
    if (ball.noBallRuns !== 1) {
      throw new Error("No-ball must contain exactly one No-ball run.");
    }

    if (ball.noBallReasons.length === 0) {
      throw new Error("No-ball must contain at least one reason.");
    }
  }

  if (ball.isFour && ball.batterRuns !== 4) {
    throw new Error("isFour requires exactly four batter runs.");
  }

  if (ball.isSix && ball.batterRuns !== 6) {
    throw new Error("isSix requires exactly six batter runs.");
  }

  if (ball.isDotBall !== (ball.isLegalDelivery && ball.totalRuns === 0)) {
    throw new Error("Invalid isDotBall value.");
  }

  if (ball.isDeadBall && !ball.deadBallReason) {
    throw new Error("Dead ball must contain a deadBallReason.");
  }

  if (!ball.isDeadBall && ball.deadBallReason !== null) {
    throw new Error("Non-dead-ball delivery cannot contain deadBallReason.");
  }

  if (ball.isDeadBall) {
    if (ball.isLegalDelivery) {
      throw new Error(
        "The generated immediate Dead-ball delivery cannot be legal.",
      );
    }

    if (!ball.isNoBall) {
      throw new Error(
        "The generated immediate Dead-ball delivery must be a No-ball.",
      );
    }

    if (ball.isWicket) {
      throw new Error("Immediate Dead-ball delivery cannot contain a wicket.");
    }
  }
}

const generateBall = (
  inningId: string,
  deliveryNo: number,
  overNo: number,
  ballNo: number,
  isFreeHit: boolean,
  strikerMatchPlayerId: string,
  nonStrikerMatchPlayerId: string,
  bowlerMatchPlayerId: string,
  wicketKeeperMatchPlayerId: string,
  fielders: readonly string[],
  random: RandomSource = Math.random,
): GeneratedBall => {
  let contactType: ContactType | null = null;
  let batOutcome: BatRunOutcome | null = null;
  let wicketOutcome: DismissalType | null = null;
  let runOutBeforeTakenRun: Exclude<
    BatRunOutcome,
    "FOUR" | "SIX" | "WICKET"
  > | null = null;
  let runOutEnd: PitchEnd | null = null;
  let runOutPlayer: RunOutPlayer | null = null;
  let runOutPlayerId: string | null = null;
  let dismissedMatchPlayerId: string | null = null;
  let fielderMatchPlayerId: string | null = null;
  let assistFielderMatchPlayerId: string | null = null;
  let wideReason: WideReason | null = null;
  let noBallReason: NoBallReason | null = null;
  let deadBallReason: DeadBallReason | null = null;
  let obstructionScenario: ObstructionScenario | null = null;

  let obstructionBeforeTakenRun: Exclude<
    BatRunOutcome,
    "FOUR" | "SIX" | "WICKET"
  > | null = null;

  if (!wicketKeeperMatchPlayerId.trim()) {
    throw new Error("Wicketkeeper player ID cannot be empty.");
  }

  if (!Number.isInteger(deliveryNo) || deliveryNo <= 0) {
    throw new Error("Delivery number must be a positive integer.");
  }

  if (!Number.isInteger(overNo) || overNo < 0) {
    throw new Error("Over number must be a non-negative integer.");
  }

  if (!Number.isInteger(ballNo) || ballNo < 1 || ballNo > 6) {
    throw new Error("Ball number must be between 1 and 6.");
  }

  if (!inningId.trim()) {
    throw new Error("Inning ID cannot be empty.");
  }

  if (
    !strikerMatchPlayerId.trim() ||
    !nonStrikerMatchPlayerId.trim() ||
    !bowlerMatchPlayerId.trim()
  ) {
    throw new Error("Player IDs cannot be empty.");
  }

  if (wicketKeeperMatchPlayerId === bowlerMatchPlayerId) {
    throw new Error("Wicketkeeper and bowler must be different players.");
  }

  if (fielders.length === 0) {
    throw new Error("Fielders list cannot be empty.");
  }

  if (fielders.some((fielderId) => !fielderId.trim())) {
    throw new Error("Fielder IDs cannot be empty.");
  }

  const uniqueFielders = [...new Set(fielders)];

  if (uniqueFielders.length !== fielders.length) {
    throw new Error("Fielders list cannot contain duplicate player IDs.");
  }

  if (!uniqueFielders.includes(wicketKeeperMatchPlayerId)) {
    throw new Error("Fielders list must include the wicketkeeper.");
  }

  if (strikerMatchPlayerId === nonStrikerMatchPlayerId) {
    throw new Error("Striker and non-striker must be different players.");
  }

  if (
    uniqueFielders.includes(strikerMatchPlayerId) ||
    uniqueFielders.includes(nonStrikerMatchPlayerId)
  ) {
    throw new Error(
      "Striker and non-striker cannot be included in the fielders list.",
    );
  }

  if (
    bowlerMatchPlayerId === strikerMatchPlayerId ||
    bowlerMatchPlayerId === nonStrikerMatchPlayerId
  ) {
    throw new Error("Bowler cannot be one of the current batters.");
  }

  if (!uniqueFielders.includes(bowlerMatchPlayerId)) {
    throw new Error("Fielders list must include the bowler.");
  }

  const pick = <T extends string>(options: readonly PercentageOption<T>[]): T =>
    getRandomByPercentage(options, random);

  const fieldersList = createEqualPercentageOptions(uniqueFielders);
  const bowledType = pick(bowledTypes);

  if (bowledType === "LEGAL") {
    contactType = pick(legalAndNoBallContactTypes);
  } else if (bowledType === "NO_BALL") {
    noBallReason = pick(noBallReasons);

    deadBallReason =
      immediateDeadBallReasonByNoBallReason[noBallReason] ?? null;

    if (!deadBallReason) {
      contactType = pick(legalAndNoBallContactTypes);
    }
  } else if (bowledType === "WIDE") {
    contactType = pick(wideBallContactTypes);
    wideReason = pick(wideReasons);
  }

  if (deadBallReason) {
    const generatedBall: GeneratedBall = {
      inningId,
      deliveryNo,
      overNo,
      ballNo,
      strikerMatchPlayerId,
      nonStrikerMatchPlayerId,
      bowlerMatchPlayerId,

      isLegalDelivery: false,
      isFreeHit,

      isDotBall: false,
      isFour: false,
      isSix: false,

      isWide: false,
      isNoBall: true,
      isBye: false,
      isLegBye: false,
      isPenalty: false,

      isDeadBall: true,
      deadBallReason,

      noBallReasons: noBallReason ? [noBallReason] : [],
      wideReason: null,
      penaltyRunReason: null,

      batterRuns: 0,
      noBallRuns: 1,
      wideRuns: 0,
      byeRuns: 0,
      legByeRuns: 0,
      penaltyRuns: 0,

      extraRuns: 1,
      totalRuns: 1,

      isWicket: false,
      dismissalType: null,
      runOutEnd: null,
      dismissedMatchPlayerId: null,
      fielderMatchPlayerId: null,
      assistFielderMatchPlayerId: null,
    };

    assertGeneratedBallConsistency(generatedBall);

    return generatedBall;
  }

  if (isFreeHit && contactType === "BAT_CONTACT") {
    batOutcome = pick(freeHitBatContactOutcomes);
  } else if (contactType === "BAT_CONTACT") {
    batOutcome = pick(batRunOutcomes);
  } else if (contactType === "BODY_CONTACT") {
    batOutcome = pick(runOutcomes);
  } else if (contactType === "NO_CONTACT") {
    batOutcome = pick(runOutcomes);
  }

  if (batOutcome === "WICKET") {
    if (bowledType === "WIDE") {
      wicketOutcome = pick(wideWicketOutcomes);
    } else if (bowledType === "NO_BALL") {
      wicketOutcome =
        contactType === "BAT_CONTACT"
          ? pick(noBallBatContactWicketOutcomes)
          : pick(noBallNonBatContactWicketOutcomes);
    } else if (contactType === "BAT_CONTACT") {
      wicketOutcome = pick(batContactWicketOutcomes);
    } else if (contactType === "BODY_CONTACT") {
      wicketOutcome = pick(bodyContactWicketOutcomes);
    } else {
      wicketOutcome = pick(noContactWicketOutcomes);
    }
  }

  if (wicketOutcome === "RUN_OUT") {
    runOutBeforeTakenRun = pick(runOutBeforeTakenRuns);
    runOutPlayer = pick(runOutPlayers);

    const completedRuns =
      runOutBeforeTakenRun === "SINGLE"
        ? 1
        : runOutBeforeTakenRun === "DOUBLE"
          ? 2
          : runOutBeforeTakenRun === "TRIPLE"
            ? 3
            : 0;

    const changedEnds = completedRuns % 2 !== 0;

    if (runOutPlayer === "STRIKER") {
      runOutEnd = changedEnds ? "STRIKER_END" : "BOWLER_END";
    } else {
      runOutEnd = changedEnds ? "BOWLER_END" : "STRIKER_END";
    }
    fielderMatchPlayerId = pick(fieldersList);
    const isAssist = pick(runOutAssistPossibilities);
    const eligibleAssistFielders = uniqueFielders.filter(
      (fielderId) => fielderId !== fielderMatchPlayerId,
    );

    if (isAssist === "ASSIST" && eligibleAssistFielders.length > 0) {
      assistFielderMatchPlayerId = pick(
        createEqualPercentageOptions(eligibleAssistFielders),
      );
    }
  } else if (wicketOutcome === "CAUGHT") {
    fielderMatchPlayerId = pick(fieldersList);
    const isAssist = pick(caughtAssistPossibilities);
    const eligibleAssistFielders = uniqueFielders.filter(
      (fielderId) => fielderId !== fielderMatchPlayerId,
    );

    if (isAssist === "ASSIST" && eligibleAssistFielders.length > 0) {
      assistFielderMatchPlayerId = pick(
        createEqualPercentageOptions(eligibleAssistFielders),
      );
    }
  } else if (wicketOutcome === "STUMPED") {
    fielderMatchPlayerId = wicketKeeperMatchPlayerId;
  }

  if (wicketOutcome === "RUN_OUT") {
    runOutPlayerId =
      runOutPlayer === "STRIKER"
        ? strikerMatchPlayerId
        : nonStrikerMatchPlayerId;
  }

  if (
    isFreeHit &&
    wicketOutcome &&
    freeHitNotOutReasons.includes(wicketOutcome)
  ) {
    wicketOutcome = null;

    batOutcome = pick(invalidFreeHitDismissalRunOutcomes);

    runOutBeforeTakenRun = null;
    runOutEnd = null;
    runOutPlayerId = null;
    fielderMatchPlayerId = null;
    assistFielderMatchPlayerId = null;
  }

  if (wicketOutcome === "RUN_OUT") {
    dismissedMatchPlayerId = runOutPlayerId;
  } else if (wicketOutcome === "OBSTRUCTING_FIELD") {
    obstructionScenario =
      bowledType !== "NO_BALL" && contactType === "BAT_CONTACT"
        ? pick(obstructionScenarios)
        : "OTHER_OBSTRUCTION";

    if (obstructionScenario === "PREVENTING_CATCH") {
      dismissedMatchPlayerId = strikerMatchPlayerId;
    } else {
      obstructionBeforeTakenRun = pick(runOutBeforeTakenRuns);

      const obstructingBatter = pick(runOutPlayers);

      dismissedMatchPlayerId =
        obstructingBatter === "STRIKER"
          ? strikerMatchPlayerId
          : nonStrikerMatchPlayerId;
    }
  } else if (wicketOutcome) {
    dismissedMatchPlayerId = strikerMatchPlayerId;
  }

  const run: Record<BatRunOutcome, number> = {
    DOT: 0,
    SINGLE: 1,
    DOUBLE: 2,
    TRIPLE: 3,
    FOUR: 4,
    SIX: 6,
    WICKET: 0,
  };

  const dismissalCompletedRunOutcome =
    wicketOutcome === "RUN_OUT"
      ? runOutBeforeTakenRun
      : wicketOutcome === "OBSTRUCTING_FIELD" &&
          obstructionScenario === "OTHER_OBSTRUCTION"
        ? obstructionBeforeTakenRun
        : null;

  const batterRuns: number =
    contactType === "BAT_CONTACT" && batOutcome
      ? batOutcome === "WICKET"
        ? dismissalCompletedRunOutcome
          ? run[dismissalCompletedRunOutcome]
          : 0
        : (run[batOutcome] ?? 0)
      : 0;

  const byeRuns: number =
    bowledType !== "WIDE"
      ? contactType === "NO_CONTACT" && batOutcome
        ? batOutcome === "WICKET"
          ? dismissalCompletedRunOutcome
            ? run[dismissalCompletedRunOutcome]
            : 0
          : (run[batOutcome] ?? 0)
        : 0
      : 0;

  const legByeRuns: number =
    contactType === "BODY_CONTACT" && batOutcome
      ? batOutcome === "WICKET"
        ? dismissalCompletedRunOutcome
          ? run[dismissalCompletedRunOutcome]
          : 0
        : (run[batOutcome] ?? 0)
      : 0;

  const noBallRuns: number = bowledType === "NO_BALL" ? 1 : 0;

  const wideRuns: number =
    bowledType === "WIDE"
      ? batOutcome === "WICKET"
        ? dismissalCompletedRunOutcome
          ? run[dismissalCompletedRunOutcome] + 1
          : 1
        : batOutcome
          ? (run[batOutcome] ?? 0) + 1
          : 1
      : 0;

  const penaltyRuns: number = 0;
  const extraRuns: number =
    noBallRuns + wideRuns + penaltyRuns + byeRuns + legByeRuns;

  const totalRuns: number = batterRuns + extraRuns;

  const generatedBall: GeneratedBall = {
    inningId,
    deliveryNo,
    overNo,
    ballNo,
    strikerMatchPlayerId,
    nonStrikerMatchPlayerId,
    bowlerMatchPlayerId,
    isLegalDelivery: bowledType === "LEGAL",
    isFreeHit,
    isDotBall: bowledType === "LEGAL" && totalRuns === 0,
    isFour: contactType === "BAT_CONTACT" ? batOutcome === "FOUR" : false,
    isSix: contactType === "BAT_CONTACT" ? batOutcome === "SIX" : false,
    isWide: bowledType === "WIDE",
    isNoBall: bowledType === "NO_BALL",
    isBye: bowledType !== "WIDE" && byeRuns > 0,
    isLegBye: bowledType !== "WIDE" && legByeRuns > 0,
    isPenalty: false,
    isDeadBall: false,
    deadBallReason: null,
    noBallReasons: noBallReason ? [noBallReason] : [],
    wideReason: wideReason,
    penaltyRunReason: null,
    batterRuns,
    noBallRuns,
    wideRuns,
    byeRuns,
    legByeRuns,
    penaltyRuns,
    extraRuns,
    totalRuns,
    isWicket: wicketOutcome !== null,
    dismissalType: wicketOutcome,
    runOutEnd,
    dismissedMatchPlayerId,
    fielderMatchPlayerId,
    assistFielderMatchPlayerId,
  };

  assertGeneratedBallConsistency(generatedBall);

  return generatedBall;
};

export default generateBall;
