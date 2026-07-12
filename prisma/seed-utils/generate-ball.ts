import {
  DismissalType,
  NoBallReason,
  PitchEnd,
  WideReason,
} from "../../src/generated/prisma/enums.js";

export type PercentageOption<T extends string> = {
  readonly value: T;
  readonly percentage: number;
};

export function getRandomByPercentage<T extends string>(
  options: readonly PercentageOption<T>[],
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

  const randomNumber = Math.random() * 100;
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
type ContactType = "BAT_CONTACT" | "BODY_CONTACT" | "NO_CONTACT";
type BatRunOutcome =
  "DOT" | "SINGLE" | "DOUBLE" | "TRIPLE" | "FOUR" | "SIX" | "WICKET";
type RunOutPlayer = "STRIKER" | "NON_STRIKER";
type AssistPossibility = "ASSIST" | "NO_ASSIST";

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

const freeHitOutcomes = [
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

const wicketOutcomes = [
  { value: "BOWLED", percentage: 23 },
  { value: "CAUGHT", percentage: 52 },
  { value: "LBW", percentage: 9 },
  { value: "RUN_OUT", percentage: 9 },
  { value: "STUMPED", percentage: 5 },
  { value: "HIT_WICKET", percentage: 1.5 },
  { value: "HIT_BALL_TWICE", percentage: 0.5 },
  { value: "OBSTRUCTING_FIELD", percentage: 0 },
  { value: "TIMED_OUT", percentage: 0 },
  { value: "RETIRED_OUT", percentage: 0 },
] as const satisfies readonly PercentageOption<DismissalType>[];

const wideWicketOutcomes = [
  { value: "STUMPED", percentage: 51 },
  { value: "RUN_OUT", percentage: 40 },
  { value: "HIT_WICKET", percentage: 9 },
  { value: "OBSTRUCTING_FIELD", percentage: 0 },
] as const satisfies readonly PercentageOption<DismissalType>[];

const runOutSides = [
  { value: "STRIKER_END", percentage: 50 },
  { value: "BOWLER_END", percentage: 50 },
] as const satisfies readonly PercentageOption<PitchEnd>[];

const runOutPlayers = [
  { value: "STRIKER", percentage: 50 },
  { value: "NON_STRIKER", percentage: 50 },
] as const satisfies readonly PercentageOption<RunOutPlayer>[];

const assistPosibilities = [
  { value: "ASSIST", percentage: 99 },
  { value: "NO_ASSIST", percentage: 1 },
] as const satisfies readonly PercentageOption<AssistPossibility>[];

const wideReasons = [
  { value: "OUTSIDE_OFF", percentage: 33 },
  { value: "DOWN_LEG", percentage: 33 },
  { value: "TOO_FAR_FROM_BATTER", percentage: 33 },
  { value: "OTHER", percentage: 1 },
] as const satisfies readonly PercentageOption<WideReason>[];

const noBallReasons = createEqualPercentageOptions([
  "OTHER",
  "OVERSTEP",
  "BACK_FOOT_FAULT",
  "ILLEGAL_ACTION",
  "UNDERARM",
  "BOUNCES_MORE_THAN_ONCE",
  "ROLLING_BALL",
  "PITCHED_OFF_PITCH",
  "BALL_COMES_TO_REST",
  "BOUNCER_OVER_HEAD",
  "HIGH_FULL_TOSS",
  "TOO_MANY_BOUNCERS",
  "DANGEROUS_BOWLING",
  "BOWLER_BREAKS_WICKET",
  "FIELDER_INTERCEPTS_DELIVERY",
  "WICKET_KEEPER_POSITION",
  "FIELDING_RESTRICTION",
] as const satisfies readonly NoBallReason[]);

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
  deadBallReason: null;
  noBallReasons: NoBallReason[];
  wideReason: WideReason | null;
  penaltyRunReason: null;
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

const generateBall = (
  inningId: string,
  deliveryNo: number,
  overNo: number,
  ballNo: number,
  isFreeHit: boolean,
  strikerMatchPlayerId: string,
  nonStrikerMatchPlayerId: string,
  bowlerMatchPlayerId: string,
  fielders: string[],
): GeneratedBall => {
  const bowledType = getRandomByPercentage(bowledTypes);
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
  let fielderMatchPlayerId: string | null = null;
  let assistFielderMatchPlayerId: string | null = null;
  let wideReason: WideReason | null = null;
  let noBallReason: NoBallReason | null = null;

  if (fielders.length === 0) {
    throw new Error("Fielders list cannot be empty.");
  }

  const fildersList = createEqualPercentageOptions(fielders);

  if (bowledType === "LEGAL") {
    contactType = getRandomByPercentage(legalAndNoBallContactTypes);
  } else if (bowledType === "NO_BALL") {
    contactType = getRandomByPercentage(legalAndNoBallContactTypes);
    noBallReason = getRandomByPercentage(noBallReasons);
  } else if (bowledType === "WIDE") {
    contactType = getRandomByPercentage(wideBallContactTypes);
    wideReason = getRandomByPercentage(wideReasons);
  }

  if (isFreeHit && contactType === "BAT_CONTACT") {
    batOutcome = getRandomByPercentage(freeHitOutcomes);
  } else if (contactType === "BAT_CONTACT") {
    batOutcome = getRandomByPercentage(batRunOutcomes);
  } else if (contactType === "BODY_CONTACT") {
    batOutcome = getRandomByPercentage(runOutcomes);
  } else if (contactType === "NO_CONTACT") {
    batOutcome = getRandomByPercentage(runOutcomes);
  }

  if (bowledType === "WIDE" && batOutcome === "WICKET") {
    wicketOutcome = getRandomByPercentage(wideWicketOutcomes);
  } else if (batOutcome === "WICKET") {
    wicketOutcome = getRandomByPercentage(wicketOutcomes);
  }

  if (wicketOutcome === "RUN_OUT") {
    runOutBeforeTakenRun = getRandomByPercentage(runOutBeforeTakenRuns);
    runOutEnd = getRandomByPercentage(runOutSides);
    runOutPlayer = getRandomByPercentage(runOutPlayers);
    fielderMatchPlayerId = getRandomByPercentage(fildersList);
    const isAssist = getRandomByPercentage(assistPosibilities);
    if (isAssist === "ASSIST") {
      assistFielderMatchPlayerId = getRandomByPercentage(fildersList);
      if (fielderMatchPlayerId === assistFielderMatchPlayerId) {
        assistFielderMatchPlayerId = null;
      }
    }
  } else if (wicketOutcome === "CAUGHT") {
    fielderMatchPlayerId = getRandomByPercentage(fildersList);
    const isAssist = getRandomByPercentage(assistPosibilities);
    if (isAssist === "ASSIST") {
      assistFielderMatchPlayerId = getRandomByPercentage(fildersList);
      if (fielderMatchPlayerId === assistFielderMatchPlayerId) {
        assistFielderMatchPlayerId = null;
      }
    }
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
    batOutcome = "DOT";
    wicketOutcome = null;
    fielderMatchPlayerId = null;
    assistFielderMatchPlayerId = null;
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

  const batterRuns: number =
    contactType === "BAT_CONTACT" && batOutcome
      ? batOutcome === "WICKET"
        ? wicketOutcome === "RUN_OUT" && runOutBeforeTakenRun
          ? (run[runOutBeforeTakenRun] ?? 0)
          : 0
        : (run[batOutcome] ?? 0)
      : 0;

  const byeRuns: number =
    bowledType !== "WIDE"
      ? contactType === "NO_CONTACT" && batOutcome
        ? batOutcome === "WICKET"
          ? wicketOutcome === "RUN_OUT" && runOutBeforeTakenRun
            ? (run[runOutBeforeTakenRun] ?? 0)
            : 0
          : (run[batOutcome] ?? 0)
        : 0
      : 0;

  const legByeRuns: number =
    contactType === "BODY_CONTACT" && batOutcome
      ? batOutcome === "WICKET"
        ? wicketOutcome === "RUN_OUT" && runOutBeforeTakenRun
          ? (run[runOutBeforeTakenRun] ?? 0)
          : 0
        : (run[batOutcome] ?? 0)
      : 0;

  const noBallRuns: number = bowledType === "NO_BALL" ? 1 : 0;

  const wideRuns: number =
    bowledType === "WIDE"
      ? batOutcome === "WICKET"
        ? wicketOutcome === "RUN_OUT" && runOutBeforeTakenRun
          ? (run[runOutBeforeTakenRun] ?? 0) + 1
          : 1
        : batOutcome
          ? (run[batOutcome] ?? 0) + 1
          : 1
      : 0;

  const penaltyRuns: number = 0;
  const extraRuns: number =
    noBallRuns + wideRuns + penaltyRuns + byeRuns + legByeRuns;

  const totalRuns: number = batterRuns + extraRuns;

  return {
    inningId,
    deliveryNo,
    overNo,
    ballNo,
    strikerMatchPlayerId,
    nonStrikerMatchPlayerId,
    bowlerMatchPlayerId,
    isLegalDelivery: bowledType === "LEGAL",
    isFreeHit: isFreeHit,
    isDotBall: bowledType === "LEGAL" ? batOutcome === "DOT" : false,
    isFour: contactType === "BAT_CONTACT" ? batOutcome === "FOUR" : false,
    isSix: contactType === "BAT_CONTACT" ? batOutcome === "SIX" : false,
    isWide: bowledType === "WIDE",
    isNoBall: bowledType === "NO_BALL",
    isBye: contactType === "NO_CONTACT",
    isLegBye: contactType === "BODY_CONTACT",
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
    isWicket: batOutcome === "WICKET",
    dismissalType: wicketOutcome,
    runOutEnd,
    dismissedMatchPlayerId:
      batOutcome === "WICKET" && wicketOutcome === "RUN_OUT"
        ? runOutPlayerId
        : batOutcome === "WICKET"
          ? strikerMatchPlayerId
          : null,
    fielderMatchPlayerId,
    assistFielderMatchPlayerId,
  };
};

export default generateBall;
