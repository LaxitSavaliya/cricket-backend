import "dotenv/config";
import pg from "pg";

import { PrismaPg } from "@prisma/adapter-pg";
import type { Player, Team } from "../src/generated/prisma/client.js";
import {
  BoundaryType,
  DismissalType,
  MatchFormat,
  MatchResultType,
  MatchStatus,
  PlayerRole,
  Prisma,
  PrismaClient,
  TossDecision,
} from "../src/generated/prisma/client.js";
import { logger } from "../src/utils/logger.js";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed database.");
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log:
    process.env["NODE_ENV"] === "development"
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"],
});

const LEGAL_DELIVERIES_PER_T10_INNINGS = 60;
const OVERS_PER_T10_INNINGS = 10;

const suratStrikersPlayers = [
  {
    playerName: "Virat Kohli",
    displayName: "V Kohli",
    role: PlayerRole.BATSMAN,
  },
  {
    playerName: "Rohit Sharma",
    displayName: "R Sharma",
    role: PlayerRole.BATSMAN,
  },
  {
    playerName: "Shubman Gill",
    displayName: "S Gill",
    role: PlayerRole.BATSMAN,
  },
  {
    playerName: "Suryakumar Yadav",
    displayName: "S Yadav",
    role: PlayerRole.BATSMAN,
  },
  {
    playerName: "Hardik Pandya",
    displayName: "H Pandya",
    role: PlayerRole.ALL_ROUNDER,
  },
  {
    playerName: "Ravindra Jadeja",
    displayName: "R Jadeja",
    role: PlayerRole.ALL_ROUNDER,
  },
  {
    playerName: "MS Dhoni",
    displayName: "M Dhoni",
    role: PlayerRole.WICKET_KEEPER_BATSMAN,
  },
  {
    playerName: "Jasprit Bumrah",
    displayName: "J Bumrah",
    role: PlayerRole.BOWLER,
  },
  {
    playerName: "Mohammed Shami",
    displayName: "M Shami",
    role: PlayerRole.BOWLER,
  },
  {
    playerName: "Kuldeep Yadav",
    displayName: "K Yadav",
    role: PlayerRole.BOWLER,
  },
  {
    playerName: "Arshdeep Singh",
    displayName: "A Singh",
    role: PlayerRole.BOWLER,
  },
] satisfies Prisma.PlayerCreateInput[];

const ahmedabadTitansPlayers = [
  {
    playerName: "Jos Buttler",
    displayName: "J Buttler",
    role: PlayerRole.WICKET_KEEPER_BATSMAN,
  },
  {
    playerName: "Quinton de Kock",
    displayName: "Q de Kock",
    role: PlayerRole.WICKET_KEEPER_BATSMAN,
  },
  {
    playerName: "KL Rahul",
    displayName: "KL Rahul",
    role: PlayerRole.WICKET_KEEPER_BATSMAN,
  },
  {
    playerName: "Yashasvi Jaiswal",
    displayName: "Y Jaiswal",
    role: PlayerRole.BATSMAN,
  },
  {
    playerName: "Rishabh Pant",
    displayName: "R Pant",
    role: PlayerRole.WICKET_KEEPER_BATSMAN,
  },
  {
    playerName: "Axar Patel",
    displayName: "A Patel",
    role: PlayerRole.ALL_ROUNDER,
  },
  {
    playerName: "Washington Sundar",
    displayName: "W Sundar",
    role: PlayerRole.ALL_ROUNDER,
  },
  {
    playerName: "Mohammed Siraj",
    displayName: "M Siraj",
    role: PlayerRole.BOWLER,
  },
  {
    playerName: "Yuzvendra Chahal",
    displayName: "Y Chahal",
    role: PlayerRole.BOWLER,
  },
  {
    playerName: "Dinesh Karthik",
    displayName: "D Karthik",
    role: PlayerRole.WICKET_KEEPER,
  },
  {
    playerName: "Glenn Phillips",
    displayName: "G Phillips",
    role: PlayerRole.WICKET_KEEPER_ALL_ROUNDER,
  },
] satisfies Prisma.PlayerCreateInput[];

const allPlayers = [...suratStrikersPlayers, ...ahmedabadTitansPlayers];

type WicketPlan = {
  dismissalType: DismissalType;
  fielder?: Player | undefined;
};

type DeliveryPlan = {
  batterRuns: number;
  wicket?: WicketPlan | undefined;
};

type BuildInningsInput = {
  matchId: string;
  inningsNo: number;
  battingPlayers: Player[];
  bowlersByOver: Player[];
  plans: DeliveryPlan[];
};

type MatchSide = {
  team: Team;
  players: Player[];
  captain: Player;
  viceCaptain: Player;
  wicketKeeper: Player;
  bowlersByOver: Player[];
};

type InningsSeedConfig = {
  totalRuns: number;
  wickets: Record<number, WicketPlan>;
  seedOffset: number;
};

type CompletedT10MatchSeed = {
  title: string;
  matchDate: string;
  venue: string;
  city: string;
  home: MatchSide;
  away: MatchSide;
  tossWinnerTeam: Team;
  tossDecision: TossDecision;
  winnerTeam: Team;
  firstIning: InningsSeedConfig;
  secondIning: InningsSeedConfig;
};

const assertNoDuplicatePlayerPairs = (
  seedPlayers: readonly Prisma.PlayerCreateInput[],
): void => {
  const seenPlayerPairs = new Set<string>();

  for (const player of seedPlayers) {
    const normalizedPair = `${player.playerName.trim().toLowerCase()}::${player.displayName
      .trim()
      .toLowerCase()}`;

    if (seenPlayerPairs.has(normalizedPair)) {
      throw new Error(
        `Duplicate player pair found in seed: ${player.playerName} / ${player.displayName}`,
      );
    }

    seenPlayerPairs.add(normalizedPair);
  }
};

const createPlayers = async (
  tx: Prisma.TransactionClient,
  seedPlayers: readonly Prisma.PlayerCreateInput[],
): Promise<Player[]> => {
  const createdPlayers: Player[] = [];

  for (const player of seedPlayers) {
    const createdPlayer = await tx.player.create({
      data: player,
    });

    createdPlayers.push(createdPlayer);
  }

  return createdPlayers;
};

const getPlayer = (players: readonly Player[], playerName: string): Player => {
  const player = players.find((item) => item.playerName === playerName);

  if (!player) {
    throw new Error(`Player not found in seed: ${playerName}`);
  }

  return player;
};

const isWicketKeeperRole = (role: PlayerRole): boolean => {
  return (
    role === PlayerRole.WICKET_KEEPER ||
    role === PlayerRole.WICKET_KEEPER_BATSMAN ||
    role === PlayerRole.WICKET_KEEPER_ALL_ROUNDER
  );
};

const assertValidWicketKeeper = (player: Player): void => {
  if (!isWicketKeeperRole(player.role)) {
    throw new Error(
      `${player.playerName} cannot be wicketkeeper. Invalid role.`,
    );
  }
};

const getBoundaryType = (batterRuns: number): BoundaryType | null => {
  if (batterRuns === 4) {
    return BoundaryType.FOUR;
  }

  if (batterRuns === 6) {
    return BoundaryType.SIX;
  }

  return null;
};

const createWicketMap = (
  wickets: readonly {
    deliveryNo: number;
    dismissalType: DismissalType;
    fielder?: Player;
  }[],
): Record<number, WicketPlan> => {
  const wicketMap: Record<number, WicketPlan> = {};

  for (const wicket of wickets) {
    if (
      wicket.deliveryNo < 1 ||
      wicket.deliveryNo > LEGAL_DELIVERIES_PER_T10_INNINGS
    ) {
      throw new Error(`Invalid wicket delivery number: ${wicket.deliveryNo}`);
    }

    if (wicketMap[wicket.deliveryNo]) {
      throw new Error(`Duplicate wicket delivery: ${wicket.deliveryNo}`);
    }

    wicketMap[wicket.deliveryNo] = {
      dismissalType: wicket.dismissalType,
      fielder: wicket.fielder,
    };
  }

  return wicketMap;
};

const getWicketDeliveries = (wickets: Record<number, WicketPlan>): number[] => {
  return Object.keys(wickets).map(Number);
};

const createRunsForTotal = ({
  totalRuns,
  wicketDeliveries,
  seedOffset,
}: {
  totalRuns: number;
  wicketDeliveries: readonly number[];
  seedOffset: number;
}): number[] => {
  const wicketDeliverySet = new Set(wicketDeliveries);
  const scoringDeliveries =
    LEGAL_DELIVERIES_PER_T10_INNINGS - wicketDeliverySet.size;
  const maxPossibleRuns = scoringDeliveries * 6;

  if (totalRuns < 0) {
    throw new Error(`Invalid innings total: ${totalRuns}`);
  }

  if (totalRuns > maxPossibleRuns) {
    throw new Error(
      `Cannot score ${totalRuns} runs with ${scoringDeliveries} scoring deliveries.`,
    );
  }

  const scoringPattern = [0, 1, 1, 2, 4, 1, 0, 6, 1, 2, 4, 0, 1, 1, 4, 2, 1, 6];
  const runs = Array.from<number>({
    length: LEGAL_DELIVERIES_PER_T10_INNINGS,
  }).fill(0);

  const availableIndexes: number[] = [];

  for (let index = 0; index < LEGAL_DELIVERIES_PER_T10_INNINGS; index += 1) {
    const deliveryNo = index + 1;

    if (!wicketDeliverySet.has(deliveryNo)) {
      availableIndexes.push(index);
    }
  }

  let remainingRuns = totalRuns;

  availableIndexes.forEach((ballIndex, availableIndex) => {
    const ballsLeftAfterThis = availableIndexes.length - availableIndex - 1;
    const minRunsNeededNow = Math.max(
      0,
      remainingRuns - ballsLeftAfterThis * 6,
    );
    const maxRunsAllowedNow = Math.min(6, remainingRuns);
    const preferredRuns =
      scoringPattern[(availableIndex + seedOffset) % scoringPattern.length] ??
      0;

    const ballRuns = Math.min(
      maxRunsAllowedNow,
      Math.max(minRunsNeededNow, preferredRuns),
    );

    runs[ballIndex] = ballRuns;
    remainingRuns -= ballRuns;
  });

  if (remainingRuns !== 0) {
    throw new Error(
      `Failed to generate innings total. Remaining: ${remainingRuns}`,
    );
  }

  return runs;
};

const createDeliveryPlans = (
  runs: readonly number[],
  wickets: Record<number, WicketPlan>,
): DeliveryPlan[] => {
  if (runs.length !== LEGAL_DELIVERIES_PER_T10_INNINGS) {
    throw new Error(`T10 innings must have exactly 60 legal deliveries.`);
  }

  return runs.map((batterRuns, index) => {
    const deliveryNo = index + 1;
    const wicket = wickets[deliveryNo];

    if (batterRuns < 0 || batterRuns > 6) {
      throw new Error(
        `Invalid batter runs at delivery ${deliveryNo}: ${batterRuns}`,
      );
    }

    if (wicket && batterRuns !== 0) {
      throw new Error(
        `Wicket delivery ${deliveryNo} should have 0 batter runs in this seed.`,
      );
    }

    return {
      batterRuns,
      wicket,
    };
  });
};

const buildInningsBalls = ({
  matchId,
  inningsNo,
  battingPlayers,
  bowlersByOver,
  plans,
}: BuildInningsInput): Prisma.BallCreateManyInput[] => {
  if (battingPlayers.length < 11) {
    throw new Error(`Innings ${inningsNo} needs 11 batting players.`);
  }

  if (bowlersByOver.length !== OVERS_PER_T10_INNINGS) {
    throw new Error(`Innings ${inningsNo} needs exactly 10 bowlers by over.`);
  }

  if (plans.length !== LEGAL_DELIVERIES_PER_T10_INNINGS) {
    throw new Error(`Innings ${inningsNo} needs exactly 60 delivery plans.`);
  }

  let striker = battingPlayers[0];
  let nonStriker = battingPlayers[1];

  if (!striker || !nonStriker) {
    throw new Error(`Innings ${inningsNo} needs at least 2 batting players.`);
  }

  let nextBatterIndex = 2;

  const balls: Prisma.BallCreateManyInput[] = [];

  for (const [index, plan] of plans.entries()) {
    const deliveryNo = index + 1;
    const overNo = Math.floor(index / 6);
    const ballNo = (index % 6) + 1;
    const bowler = bowlersByOver[overNo];

    if (!bowler) {
      throw new Error(
        `Innings ${inningsNo} bowler not found for over ${overNo}.`,
      );
    }

    balls.push({
      matchId,
      inningsNo,
      deliveryNo,
      overNo,
      ballNo,

      strikerId: striker.id,
      nonStrikerId: nonStriker.id,
      bowlerId: bowler.id,

      boundaryType: getBoundaryType(plan.batterRuns),

      batterRuns: plan.batterRuns,
      noBallRuns: 0,
      wideRuns: 0,
      byeRuns: 0,
      legByeRuns: 0,
      penaltyRuns: 0,
      extraRuns: 0,
      totalRuns: plan.batterRuns,

      isWicket: Boolean(plan.wicket),
      dismissalType: plan.wicket?.dismissalType ?? null,
      dismissedPlayerId: plan.wicket ? striker.id : null,
      fielderId: plan.wicket?.fielder?.id ?? null,
    });

    if (plan.wicket) {
      const nextBatter = battingPlayers[nextBatterIndex];
      if (!nextBatter) {
        throw new Error(`No next batter available in innings ${inningsNo}.`);
      }

      striker = nextBatter;
      nextBatterIndex += 1;
    }

    if (plan.batterRuns % 2 === 1) {
      [striker, nonStriker] = [nonStriker, striker];
    }

    if (ballNo === 6) {
      [striker, nonStriker] = [nonStriker, striker];
    }
  }

  return balls;
};

const createMatchPlayerRows = ({
  players,
  teamId,
  captain,
  viceCaptain,
  wicketKeeper,
}: {
  players: Player[];
  teamId: string;
  captain: Player;
  viceCaptain: Player;
  wicketKeeper: Player;
}) => {
  return players.map((player, index) => ({
    teamId,
    playerId: player.id,
    isPlayingEleven: true,
    isCaptain: player.id === captain.id,
    isViceCaptain: player.id === viceCaptain.id,
    isWicketKeeper: player.id === wicketKeeper.id,
    battingOrder: index + 1,
  }));
};

const getResultText = ({
  home,
  away,
  winnerTeam,
  firstIningRuns,
  secondIningRuns,
  secondIningWickets,
}: {
  home: MatchSide;
  away: MatchSide;
  winnerTeam: Team;
  firstIningRuns: number;
  secondIningRuns: number;
  secondIningWickets: number;
}): string => {
  if (winnerTeam.id === home.team.id) {
    return `${home.team.teamName} won by ${firstIningRuns - secondIningRuns} runs`;
  }

  if (winnerTeam.id === away.team.id) {
    return `${away.team.teamName} won by ${10 - secondIningWickets} wickets`;
  }

  return "Match completed";
};

const createCompletedT10Match = async (
  tx: Prisma.TransactionClient,
  seed: CompletedT10MatchSeed,
) => {
  const firstIningWicketDeliveries = getWicketDeliveries(
    seed.firstIning.wickets,
  );
  const secondIningWicketDeliveries = getWicketDeliveries(
    seed.secondIning.wickets,
  );

  const firstIningRunsArray = createRunsForTotal({
    totalRuns: seed.firstIning.totalRuns,
    wicketDeliveries: firstIningWicketDeliveries,
    seedOffset: seed.firstIning.seedOffset,
  });

  const secondIningRunsArray = createRunsForTotal({
    totalRuns: seed.secondIning.totalRuns,
    wicketDeliveries: secondIningWicketDeliveries,
    seedOffset: seed.secondIning.seedOffset,
  });

  const firstIningPlans = createDeliveryPlans(
    firstIningRunsArray,
    seed.firstIning.wickets,
  );

  const secondIningPlans = createDeliveryPlans(
    secondIningRunsArray,
    seed.secondIning.wickets,
  );

  const firstIningWickets = firstIningWicketDeliveries.length;
  const secondIningWickets = secondIningWicketDeliveries.length;

  const match = await tx.match.create({
    data: {
      title: seed.title,
      matchFormat: MatchFormat.T10,
      status: MatchStatus.COMPLETED,
      matchDate: new Date(seed.matchDate),

      venue: seed.venue,
      city: seed.city,

      homeTeam: {
        connect: {
          id: seed.home.team.id,
        },
      },
      awayTeam: {
        connect: {
          id: seed.away.team.id,
        },
      },

      tossWinnerTeam: {
        connect: {
          id: seed.tossWinnerTeam.id,
        },
      },
      tossDecision: seed.tossDecision,

      winnerTeam: {
        connect: {
          id: seed.winnerTeam.id,
        },
      },
      resultType: MatchResultType.NORMAL,
      matchTextResult: getResultText({
        home: seed.home,
        away: seed.away,
        winnerTeam: seed.winnerTeam,
        firstIningRuns: seed.firstIning.totalRuns,
        secondIningRuns: seed.secondIning.totalRuns,
        secondIningWickets,
      }),

      firstIningRuns: seed.firstIning.totalRuns,
      firstIningWickets,
      firstIningOvers: OVERS_PER_T10_INNINGS,

      secondIningRuns: seed.secondIning.totalRuns,
      secondIningWickets,
      secondIningOvers: OVERS_PER_T10_INNINGS,

      matchPlayers: {
        createMany: {
          data: [
            ...createMatchPlayerRows({
              players: seed.home.players,
              teamId: seed.home.team.id,
              captain: seed.home.captain,
              viceCaptain: seed.home.viceCaptain,
              wicketKeeper: seed.home.wicketKeeper,
            }),
            ...createMatchPlayerRows({
              players: seed.away.players,
              teamId: seed.away.team.id,
              captain: seed.away.captain,
              viceCaptain: seed.away.viceCaptain,
              wicketKeeper: seed.away.wicketKeeper,
            }),
          ],
        },
      },
    },
  });

  const balls = [
    ...buildInningsBalls({
      matchId: match.id,
      inningsNo: 1,
      battingPlayers: seed.home.players,
      bowlersByOver: seed.away.bowlersByOver,
      plans: firstIningPlans,
    }),
    ...buildInningsBalls({
      matchId: match.id,
      inningsNo: 2,
      battingPlayers: seed.away.players,
      bowlersByOver: seed.home.bowlersByOver,
      plans: secondIningPlans,
    }),
  ];

  await tx.ball.createMany({
    data: balls,
  });

  return {
    matchId: match.id,
    title: seed.title,
    ballsCreated: balls.length,
    firstIningScore: `${seed.firstIning.totalRuns}/${firstIningWickets}`,
    secondIningScore: `${seed.secondIning.totalRuns}/${secondIningWickets}`,
    result: getResultText({
      home: seed.home,
      away: seed.away,
      winnerTeam: seed.winnerTeam,
      firstIningRuns: seed.firstIning.totalRuns,
      secondIningRuns: seed.secondIning.totalRuns,
      secondIningWickets,
    }),
  };
};

const seedDatabase = async (): Promise<void> => {
  assertNoDuplicatePlayerPairs(allPlayers);

  const isProduction = process.env["NODE_ENV"] === "production";
  const forceSeed = process.env["FORCE_SEED"] === "true";

  if (isProduction && !forceSeed) {
    logger.warn(
      "Detected production environment. Wiping database is disabled by default in production. " +
        "If you really want to seed and wipe production database, run with FORCE_SEED=true.",
    );
    return;
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.ball.deleteMany({});
      await tx.matchPlayer.deleteMany({});
      await tx.match.deleteMany({});
      await tx.team.deleteMany({});
      await tx.player.deleteMany({});

      logger.info(
        "Deleted existing balls, match players, matches, teams, and players.",
      );

      const suratPlayers = await createPlayers(tx, suratStrikersPlayers);
      const ahmedabadPlayers = await createPlayers(tx, ahmedabadTitansPlayers);

      const suratStrikers = await tx.team.create({
        data: {
          teamName: "Surat Strikers",
          shortName: "SRT",
          logoUrl: null,
        },
      });

      const ahmedabadTitans = await tx.team.create({
        data: {
          teamName: "Ahmedabad Titans",
          shortName: "AMD",
          logoUrl: null,
        },
      });

      const suratCaptain = getPlayer(suratPlayers, "Virat Kohli");
      const suratViceCaptain = getPlayer(suratPlayers, "Rohit Sharma");
      const suratWicketKeeper = getPlayer(suratPlayers, "MS Dhoni");

      const ahmedabadCaptain = getPlayer(ahmedabadPlayers, "Jos Buttler");
      const ahmedabadViceCaptain = getPlayer(ahmedabadPlayers, "KL Rahul");
      const ahmedabadWicketKeeper = getPlayer(ahmedabadPlayers, "Jos Buttler");

      assertValidWicketKeeper(suratWicketKeeper);
      assertValidWicketKeeper(ahmedabadWicketKeeper);

      const suratSide: MatchSide = {
        team: suratStrikers,
        players: suratPlayers,
        captain: suratCaptain,
        viceCaptain: suratViceCaptain,
        wicketKeeper: suratWicketKeeper,
        bowlersByOver: [
          getPlayer(suratPlayers, "Jasprit Bumrah"),
          getPlayer(suratPlayers, "Mohammed Shami"),
          getPlayer(suratPlayers, "Kuldeep Yadav"),
          getPlayer(suratPlayers, "Arshdeep Singh"),
          getPlayer(suratPlayers, "Hardik Pandya"),
          getPlayer(suratPlayers, "Jasprit Bumrah"),
          getPlayer(suratPlayers, "Mohammed Shami"),
          getPlayer(suratPlayers, "Kuldeep Yadav"),
          getPlayer(suratPlayers, "Arshdeep Singh"),
          getPlayer(suratPlayers, "Jasprit Bumrah"),
        ],
      };

      const ahmedabadSide: MatchSide = {
        team: ahmedabadTitans,
        players: ahmedabadPlayers,
        captain: ahmedabadCaptain,
        viceCaptain: ahmedabadViceCaptain,
        wicketKeeper: ahmedabadWicketKeeper,
        bowlersByOver: [
          getPlayer(ahmedabadPlayers, "Mohammed Siraj"),
          getPlayer(ahmedabadPlayers, "Yuzvendra Chahal"),
          getPlayer(ahmedabadPlayers, "Axar Patel"),
          getPlayer(ahmedabadPlayers, "Washington Sundar"),
          getPlayer(ahmedabadPlayers, "Mohammed Siraj"),
          getPlayer(ahmedabadPlayers, "Yuzvendra Chahal"),
          getPlayer(ahmedabadPlayers, "Axar Patel"),
          getPlayer(ahmedabadPlayers, "Washington Sundar"),
          getPlayer(ahmedabadPlayers, "Glenn Phillips"),
          getPlayer(ahmedabadPlayers, "Mohammed Siraj"),
        ],
      };

      const matchSeeds: CompletedT10MatchSeed[] = [
        {
          title: "Surat Strikers vs Ahmedabad Titans - T10 Match",
          matchDate: "2026-06-15T10:00:00.000Z",
          venue: "Lalbhai Contractor Stadium",
          city: "Surat",
          home: suratSide,
          away: ahmedabadSide,
          tossWinnerTeam: suratStrikers,
          tossDecision: TossDecision.BAT,
          winnerTeam: suratStrikers,
          firstIning: {
            totalRuns: 118,
            seedOffset: 0,
            wickets: createWicketMap([
              {
                deliveryNo: 4,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Jos Buttler"),
              },
              {
                deliveryNo: 16,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 26,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "KL Rahul"),
              },
              {
                deliveryNo: 56,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(ahmedabadPlayers, "Axar Patel"),
              },
            ]),
          },
          secondIning: {
            totalRuns: 106,
            seedOffset: 3,
            wickets: createWicketMap([
              {
                deliveryNo: 2,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "MS Dhoni"),
              },
              {
                deliveryNo: 18,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 27,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "Rohit Sharma"),
              },
              {
                deliveryNo: 42,
                dismissalType: DismissalType.LBW,
              },
              {
                deliveryNo: 57,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(suratPlayers, "Ravindra Jadeja"),
              },
            ]),
          },
        },
        {
          title: "Ahmedabad Titans vs Surat Strikers - T10 League Match",
          matchDate: "2026-06-16T14:30:00.000Z",
          venue: "Narendra Modi Stadium",
          city: "Ahmedabad",
          home: ahmedabadSide,
          away: suratSide,
          tossWinnerTeam: ahmedabadTitans,
          tossDecision: TossDecision.BAT,
          winnerTeam: suratStrikers,
          firstIning: {
            totalRuns: 92,
            seedOffset: 5,
            wickets: createWicketMap([
              {
                deliveryNo: 6,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "MS Dhoni"),
              },
              {
                deliveryNo: 12,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 21,
                dismissalType: DismissalType.LBW,
              },
              {
                deliveryNo: 33,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "Suryakumar Yadav"),
              },
              {
                deliveryNo: 45,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(suratPlayers, "Ravindra Jadeja"),
              },
              {
                deliveryNo: 52,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "Virat Kohli"),
              },
              {
                deliveryNo: 59,
                dismissalType: DismissalType.BOWLED,
              },
            ]),
          },
          secondIning: {
            totalRuns: 96,
            seedOffset: 8,
            wickets: createWicketMap([
              {
                deliveryNo: 9,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Jos Buttler"),
              },
              {
                deliveryNo: 25,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 37,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Yashasvi Jaiswal"),
              },
              {
                deliveryNo: 49,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(ahmedabadPlayers, "Axar Patel"),
              },
            ]),
          },
        },
        {
          title:
            "Surat Strikers vs Ahmedabad Titans - T10 Super Over Qualifier",
          matchDate: "2026-06-17T09:00:00.000Z",
          venue: "Lalbhai Contractor Stadium",
          city: "Surat",
          home: suratSide,
          away: ahmedabadSide,
          tossWinnerTeam: ahmedabadTitans,
          tossDecision: TossDecision.BOWL,
          winnerTeam: suratStrikers,
          firstIning: {
            totalRuns: 132,
            seedOffset: 2,
            wickets: createWicketMap([
              {
                deliveryNo: 14,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "KL Rahul"),
              },
              {
                deliveryNo: 39,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 55,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Glenn Phillips"),
              },
            ]),
          },
          secondIning: {
            totalRuns: 125,
            seedOffset: 6,
            wickets: createWicketMap([
              {
                deliveryNo: 3,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "MS Dhoni"),
              },
              {
                deliveryNo: 11,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 19,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "Rohit Sharma"),
              },
              {
                deliveryNo: 28,
                dismissalType: DismissalType.LBW,
              },
              {
                deliveryNo: 36,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(suratPlayers, "Hardik Pandya"),
              },
              {
                deliveryNo: 44,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "Shubman Gill"),
              },
              {
                deliveryNo: 51,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 58,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(suratPlayers, "Ravindra Jadeja"),
              },
            ]),
          },
        },
        {
          title: "Ahmedabad Titans vs Surat Strikers - T10 Night Clash",
          matchDate: "2026-06-18T15:30:00.000Z",
          venue: "Narendra Modi Stadium",
          city: "Ahmedabad",
          home: ahmedabadSide,
          away: suratSide,
          tossWinnerTeam: suratStrikers,
          tossDecision: TossDecision.BOWL,
          winnerTeam: suratStrikers,
          firstIning: {
            totalRuns: 110,
            seedOffset: 10,
            wickets: createWicketMap([
              {
                deliveryNo: 5,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "MS Dhoni"),
              },
              {
                deliveryNo: 17,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 29,
                dismissalType: DismissalType.LBW,
              },
              {
                deliveryNo: 40,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "Virat Kohli"),
              },
              {
                deliveryNo: 50,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(suratPlayers, "Ravindra Jadeja"),
              },
              {
                deliveryNo: 60,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "Suryakumar Yadav"),
              },
            ]),
          },
          secondIning: {
            totalRuns: 111,
            seedOffset: 1,
            wickets: createWicketMap([
              {
                deliveryNo: 7,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Jos Buttler"),
              },
              {
                deliveryNo: 13,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 24,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Yashasvi Jaiswal"),
              },
              {
                deliveryNo: 35,
                dismissalType: DismissalType.LBW,
              },
              {
                deliveryNo: 47,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(ahmedabadPlayers, "Axar Patel"),
              },
              {
                deliveryNo: 54,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Glenn Phillips"),
              },
            ]),
          },
        },
        {
          title: "Surat Strikers vs Ahmedabad Titans - T10 Final",
          matchDate: "2026-06-19T11:00:00.000Z",
          venue: "Lalbhai Contractor Stadium",
          city: "Surat",
          home: suratSide,
          away: ahmedabadSide,
          tossWinnerTeam: suratStrikers,
          tossDecision: TossDecision.BAT,
          winnerTeam: ahmedabadTitans,
          firstIning: {
            totalRuns: 87,
            seedOffset: 13,
            wickets: createWicketMap([
              {
                deliveryNo: 4,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Jos Buttler"),
              },
              {
                deliveryNo: 10,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 18,
                dismissalType: DismissalType.LBW,
              },
              {
                deliveryNo: 26,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "KL Rahul"),
              },
              {
                deliveryNo: 34,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(ahmedabadPlayers, "Axar Patel"),
              },
              {
                deliveryNo: 41,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Yashasvi Jaiswal"),
              },
              {
                deliveryNo: 48,
                dismissalType: DismissalType.BOWLED,
              },
              {
                deliveryNo: 53,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(ahmedabadPlayers, "Glenn Phillips"),
              },
              {
                deliveryNo: 59,
                dismissalType: DismissalType.RUN_OUT,
                fielder: getPlayer(ahmedabadPlayers, "Washington Sundar"),
              },
            ]),
          },
          secondIning: {
            totalRuns: 88,
            seedOffset: 4,
            wickets: createWicketMap([
              {
                deliveryNo: 15,
                dismissalType: DismissalType.CAUGHT,
                fielder: getPlayer(suratPlayers, "MS Dhoni"),
              },
              {
                deliveryNo: 38,
                dismissalType: DismissalType.BOWLED,
              },
            ]),
          },
        },
      ];

      const seededMatches = [];

      for (const matchSeed of matchSeeds) {
        const seededMatch = await createCompletedT10Match(tx, matchSeed);
        seededMatches.push(seededMatch);
      }

      logger.info(
        {
          playersCreated: allPlayers.length,
          teamsCreated: 2,
          matchesCreated: seededMatches.length,
          ballsCreated: seededMatches.reduce(
            (sum, match) => sum + match.ballsCreated,
            0,
          ),
          seededMatches,
        },
        "Seed completed successfully.",
      );
    },
    {
      maxWait: 10_000,
      timeout: 30_000,
    },
  );
};

try {
  await seedDatabase();
} catch (error) {
  logger.error({ err: error }, "Seed failed.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
  await pool.end();
}
