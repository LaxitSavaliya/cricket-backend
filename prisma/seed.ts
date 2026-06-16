import "dotenv/config";
import pg from "pg";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  BoundaryType,
  DismissalType,
  MatchFormat,
  MatchResultType,
  MatchStatus,
  Player,
  PlayerRole,
  Prisma,
  PrismaClient,
  TossDecision,
} from "../src/generated/prisma/client.js";
import { logger } from "../src/utils/logger.js";

const databaseUrl = process.env.DATABASE_URL;

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
    process.env.NODE_ENV === "development"
      ? ["query", "info", "warn", "error"]
      : ["warn", "error"],
});

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
  fielder?: Player;
};

type DeliveryPlan = {
  batterRuns: number;
  wicket?: WicketPlan;
};

type BuildInningsInput = {
  matchId: string;
  inningsNo: number;
  battingPlayers: Player[];
  bowlersByOver: Player[];
  plans: DeliveryPlan[];
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

const createDeliveryPlans = (
  runs: readonly number[],
  wickets: Record<number, WicketPlan>,
): DeliveryPlan[] => {
  if (runs.length !== 60) {
    throw new Error(`T10 innings must have exactly 60 legal deliveries.`);
  }

  return runs.map((batterRuns, index) => {
    const deliveryNo = index + 1;
    const wicket = wickets[deliveryNo];

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

  if (bowlersByOver.length !== 10) {
    throw new Error(`Innings ${inningsNo} needs exactly 10 bowlers by over.`);
  }

  if (plans.length !== 60) {
    throw new Error(`Innings ${inningsNo} needs exactly 60 delivery plans.`);
  }

  let striker = battingPlayers[0];
  let nonStriker = battingPlayers[1];
  let nextBatterIndex = 2;

  const balls: Prisma.BallCreateManyInput[] = [];

  for (const [index, plan] of plans.entries()) {
    const deliveryNo = index + 1;
    const overNo = Math.floor(index / 6);
    const ballNo = (index % 6) + 1;
    const bowler = bowlersByOver[overNo];

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
      if (nextBatterIndex >= battingPlayers.length) {
        throw new Error(`No next batter available in innings ${inningsNo}.`);
      }

      striker = battingPlayers[nextBatterIndex];
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

const seedDatabase = async (): Promise<void> => {
  assertNoDuplicatePlayerPairs(allPlayers);

  const isProduction = process.env.NODE_ENV === "production";
  const forceSeed = process.env.FORCE_SEED === "true";

  if (isProduction && !forceSeed) {
    logger.warn(
      "Detected production environment. Wiping database is disabled by default in production. " +
        "If you really want to seed and wipe production database, run with FORCE_SEED=true.",
    );
    return;
  }

  await prisma.$transaction(async (tx) => {
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

    const match = await tx.match.create({
      data: {
        title: "Surat Strikers vs Ahmedabad Titans - T10 Match",
        matchFormat: MatchFormat.T10,
        status: MatchStatus.COMPLETED,
        matchDate: new Date("2026-06-15T10:00:00.000Z"),

        venue: "Lalbhai Contractor Stadium",
        city: "Surat",

        homeTeam: {
          connect: {
            id: suratStrikers.id,
          },
        },
        awayTeam: {
          connect: {
            id: ahmedabadTitans.id,
          },
        },

        tossWinnerTeam: {
          connect: {
            id: suratStrikers.id,
          },
        },
        tossDecision: TossDecision.BAT,

        winnerTeam: {
          connect: {
            id: suratStrikers.id,
          },
        },
        resultType: MatchResultType.NORMAL,

        matchPlayers: {
          createMany: {
            data: [
              ...createMatchPlayerRows({
                players: suratPlayers,
                teamId: suratStrikers.id,
                captain: suratCaptain,
                viceCaptain: suratViceCaptain,
                wicketKeeper: suratWicketKeeper,
              }),
              ...createMatchPlayerRows({
                players: ahmedabadPlayers,
                teamId: ahmedabadTitans.id,
                captain: ahmedabadCaptain,
                viceCaptain: ahmedabadViceCaptain,
                wicketKeeper: ahmedabadWicketKeeper,
              }),
            ],
          },
        },
      },
    });

    /**
     * Completed T10 match score:
     *
     * Surat Strikers:      118/4 in 10 overs
     * Ahmedabad Titans:    106/5 in 10 overs
     *
     * Result:
     * Surat Strikers won by 12 runs.
     */

    const inningsOneRuns = [
      4, 1, 1, 0, 6, 1, 0, 4, 1, 2, 1, 4, 1, 1, 6, 0, 4, 1, 2, 4, 0, 1, 1, 6, 1,
      0, 4, 4, 1, 2, 6, 1, 0, 1, 4, 1, 1, 4, 1, 6, 0, 2, 0, 1, 4, 1, 6, 1, 1, 2,
      0, 4, 1, 1, 1, 0, 2, 1, 0, 1,
    ];

    const inningsTwoRuns = [
      1, 0, 4, 1, 1, 2, 4, 1, 0, 1, 2, 1, 0, 4, 1, 1, 6, 0, 1, 2, 1, 4, 0, 1, 6,
      0, 0, 2, 4, 1, 1, 1, 0, 4, 2, 1, 0, 6, 1, 1, 4, 0, 1, 2, 1, 0, 4, 1, 6, 1,
      0, 1, 2, 1, 4, 1, 0, 6, 1, 1,
    ];

    const inningsOnePlans = createDeliveryPlans(inningsOneRuns, {
      4: {
        dismissalType: DismissalType.CAUGHT,
        fielder: getPlayer(ahmedabadPlayers, "Jos Buttler"),
      },
      16: {
        dismissalType: DismissalType.BOWLED,
      },
      26: {
        dismissalType: DismissalType.CAUGHT,
        fielder: getPlayer(ahmedabadPlayers, "KL Rahul"),
      },
      56: {
        dismissalType: DismissalType.RUN_OUT,
        fielder: getPlayer(ahmedabadPlayers, "Axar Patel"),
      },
    });

    const inningsTwoPlans = createDeliveryPlans(inningsTwoRuns, {
      2: {
        dismissalType: DismissalType.CAUGHT,
        fielder: getPlayer(suratPlayers, "MS Dhoni"),
      },
      18: {
        dismissalType: DismissalType.BOWLED,
      },
      27: {
        dismissalType: DismissalType.CAUGHT,
        fielder: getPlayer(suratPlayers, "Rohit Sharma"),
      },
      42: {
        dismissalType: DismissalType.LBW,
      },
      57: {
        dismissalType: DismissalType.RUN_OUT,
        fielder: getPlayer(suratPlayers, "Ravindra Jadeja"),
      },
    });

    const inningsOneBowlersByOver = [
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
    ];

    const inningsTwoBowlersByOver = [
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
    ];

    const balls = [
      ...buildInningsBalls({
        matchId: match.id,
        inningsNo: 1,
        battingPlayers: suratPlayers,
        bowlersByOver: inningsOneBowlersByOver,
        plans: inningsOnePlans,
      }),
      ...buildInningsBalls({
        matchId: match.id,
        inningsNo: 2,
        battingPlayers: ahmedabadPlayers,
        bowlersByOver: inningsTwoBowlersByOver,
        plans: inningsTwoPlans,
      }),
    ];

    await tx.ball.createMany({
      data: balls,
    });

    const inningsOneTotal = inningsOneRuns.reduce((sum, runs) => sum + runs, 0);
    const inningsTwoTotal = inningsTwoRuns.reduce((sum, runs) => sum + runs, 0);

    logger.info(
      {
        playersCreated: allPlayers.length,
        teamsCreated: 2,
        matchId: match.id,
        ballsCreated: balls.length,
        inningsOneScore: `${inningsOneTotal}/4`,
        inningsTwoScore: `${inningsTwoTotal}/5`,
        result: `Surat Strikers won by ${inningsOneTotal - inningsTwoTotal} runs`,
      },
      "Seed completed successfully.",
    );
  });
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
