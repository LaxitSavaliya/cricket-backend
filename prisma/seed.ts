import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client.js";
import matches from "./seed-data/matches.js";
import matchPlayers, {
  type matchPlayerType,
} from "./seed-data/matchPlayers.js";
import { matchGenerationOptions } from "./seed-data/options.js";
import organizations from "./seed-data/organizations.js";
import players from "./seed-data/players.js";
import teams from "./seed-data/teams.js";
import tournaments from "./seed-data/tournaments.js";
import users from "./seed-data/users.js";
import { getMatchDataForMatch } from "./seed-utils/generate-matchData.js";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const prisma = new PrismaClient({
  adapter,
});

const BALL_INSERT_CHUNK_SIZE = 1_000;

const assertNotProduction = (): void => {
  if (
    process.env["NODE_ENV"] === "production" &&
    process.env["ALLOW_DB_SEED"] !== "true"
  ) {
    throw new Error(
      "Database seeding is blocked in production. " +
        "Set ALLOW_DB_SEED=true only when production seeding is intentional.",
    );
  }
};

const assertNotEmpty = (
  values: readonly unknown[],
  entityName: string,
): void => {
  if (values.length === 0) {
    throw new Error(`${entityName} seed data cannot be empty.`);
  }
};

const assertUniqueStrings = (
  values: readonly string[],
  fieldName: string,
): void => {
  const seen = new Set<string>();

  for (const value of values) {
    if (!value.trim()) {
      throw new Error(`${fieldName} cannot contain empty values.`);
    }

    if (seen.has(value)) {
      throw new Error(`${fieldName} contains duplicate value "${value}".`);
    }

    seen.add(value);
  }
};

const createChunks = <T>(values: readonly T[], chunkSize: number): T[][] => {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("Chunk size must be a positive integer.");
  }

  const chunks: T[][] = [];

  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }

  return chunks;
};

const validateSourceSeedData = (): void => {
  assertNotEmpty(organizations, "Organization");
  assertNotEmpty(tournaments, "Tournament");
  assertNotEmpty(players, "Player");
  assertNotEmpty(teams, "Team");
  assertNotEmpty(matches, "Match");
  assertNotEmpty(matchPlayers, "Match-player");

  assertUniqueStrings(
    organizations.map((org) => org.id),
    "Organization IDs",
  );

  assertUniqueStrings(
    tournaments.map((tour) => tour.id),
    "Tournament IDs",
  );

  assertUniqueStrings(
    players.map((player) => player.id),
    "Player IDs",
  );

  assertUniqueStrings(
    players.map((player) => player.slug),
    "Player slugs",
  );

  assertUniqueStrings(
    teams.map((team) => team.id),
    "Team IDs",
  );

  assertUniqueStrings(
    matches.map((match) => match.id),
    "Match IDs",
  );

  assertUniqueStrings(
    matchPlayers.map((matchPlayer) => matchPlayer.id),
    "Match-player IDs",
  );

  const teamIdSet = new Set(teams.map((team) => team.id));
  for (const tournament of tournaments) {
    for (const teamId of tournament.teamIds) {
      if (!teamIdSet.has(teamId)) {
        throw new Error(
          `Tournament "${tournament.id}" references unknown team ID "${teamId}".`,
        );
      }
    }
  }
};

const validateGeneratedPlayerOrders = (
  generatedMatchPlayers: readonly matchPlayerType[],
): void => {
  const playersByMatchAndTeam = new Map<string, matchPlayerType[]>();

  for (const matchPlayer of generatedMatchPlayers) {
    const key = `${matchPlayer.matchId}:${matchPlayer.teamId}`;

    const existingPlayers = playersByMatchAndTeam.get(key);

    if (existingPlayers) {
      existingPlayers.push(matchPlayer);
    } else {
      playersByMatchAndTeam.set(key, [matchPlayer]);
    }
  }

  for (const [key, teamPlayers] of playersByMatchAndTeam) {
    const invalidBenchPlayer = teamPlayers.find(
      (matchPlayer) =>
        !matchPlayer.isPlaying &&
        (matchPlayer.lineupOrder !== null ||
          matchPlayer.battingOrder !== null ||
          matchPlayer.isWicketKeeper === true),
    );

    if (invalidBenchPlayer) {
      throw new Error(
        `Bench match-player "${invalidBenchPlayer.id}" cannot have lineupOrder, battingOrder, or wicketkeeper assignment.`,
      );
    }

    const playingPlayers = teamPlayers.filter(
      (matchPlayer) => matchPlayer.isPlaying,
    );

    const wicketKeepers = playingPlayers.filter(
      (matchPlayer) => matchPlayer.isWicketKeeper === true,
    );

    if (wicketKeepers.length !== 1) {
      throw new Error(
        `Team "${key}" must have exactly one playing wicketkeeper. Found ${wicketKeepers.length}.`,
      );
    }

    const lineupOrders = playingPlayers.map((matchPlayer) => {
      if (matchPlayer.lineupOrder === null) {
        throw new Error(
          `Playing match-player "${matchPlayer.id}" in "${key}" has no lineupOrder.`,
        );
      }

      return matchPlayer.lineupOrder;
    });

    if (new Set(lineupOrders).size !== lineupOrders.length) {
      throw new Error(`Duplicate lineupOrder values found for "${key}".`);
    }

    const battingPlayers = playingPlayers.filter(
      (matchPlayer) => matchPlayer.didBat,
    );

    const battingOrders = battingPlayers.map((matchPlayer) => {
      if (matchPlayer.battingOrder === null) {
        throw new Error(
          `Match-player "${matchPlayer.id}" batted but has no battingOrder.`,
        );
      }

      return matchPlayer.battingOrder;
    });

    if (new Set(battingOrders).size !== battingOrders.length) {
      throw new Error(`Duplicate battingOrder values found for "${key}".`);
    }

    const sortedBattingOrders = [...battingOrders].sort(
      (firstOrder, secondOrder) => firstOrder - secondOrder,
    );

    for (const [index, battingOrder] of sortedBattingOrders.entries()) {
      const expectedOrder = index + 1;

      if (battingOrder !== expectedOrder) {
        throw new Error(
          `Batting orders for "${key}" must be continuous from 1 to ${battingPlayers.length}. Expected ${expectedOrder}, received ${battingOrder}.`,
        );
      }
    }

    const invalidNonBatter = playingPlayers.find(
      (matchPlayer) => !matchPlayer.didBat && matchPlayer.battingOrder !== null,
    );

    if (invalidNonBatter) {
      throw new Error(
        `Match-player "${invalidNonBatter.id}" did not bat but has battingOrder ${invalidNonBatter.battingOrder}.`,
      );
    }
  }
};

const seedDatabase = async (): Promise<void> => {
  assertNotProduction();
  validateSourceSeedData();

  console.log("Generating match data...");

  /*
   * Generate and validate all derived data before inserting anything.
   * When generation throws, the database remains untouched.
   */
  const { matchPlayersData, matchInningsData, ballsData } =
    getMatchDataForMatch(matches, matchPlayers, matchGenerationOptions);

  validateGeneratedPlayerOrders(matchPlayersData);

  assertUniqueStrings(
    matchPlayersData.map((matchPlayer) => matchPlayer.id),
    "Generated match-player IDs",
  );

  assertUniqueStrings(
    matchInningsData.map((inning) => inning.id),
    "Generated match-innings IDs",
  );

  assertUniqueStrings(
    ballsData.map((ball) => ball.id),
    "Generated ball IDs",
  );

  console.log("Starting database transaction...");

  const insertedCounts = await prisma.$transaction(
    async (transaction) => {
      /*
       * db:seed expects an empty application database.
       * Use `npm run db:reset` to clean and seed together.
       */
      const existingUserCount = await transaction.user.count();
      const existingOrgCount = await transaction.organization.count();
      const existingTourCount = await transaction.tournament.count();
      const existingTeamCount = await transaction.team.count();
      const existingPlayerCount = await transaction.player.count();
      const existingMatchCount = await transaction.match.count();
      const existingMatchPlayerCount = await transaction.matchPlayer.count();
      const existingInningCount = await transaction.matchInning.count();
      const existingBallCount = await transaction.ball.count();

      const databaseContainsSeedData =
        existingUserCount > 0 ||
        existingOrgCount > 0 ||
        existingTourCount > 0 ||
        existingTeamCount > 0 ||
        existingPlayerCount > 0 ||
        existingMatchCount > 0 ||
        existingMatchPlayerCount > 0 ||
        existingInningCount > 0 ||
        existingBallCount > 0;

      if (databaseContainsSeedData) {
        throw new Error(
          "Database seed tables are not empty. " +
            "Run `npm run db:clean` first or use `npm run db:reset`.",
        );
      }

      /*
       * Parent records must be inserted before records containing
       * foreign keys that reference them.
       */

      console.log("Seeding users...");

      const usersResult = await transaction.user.createMany({
        data: users,
      });

      console.log("Seeding organizations...");

      const orgsResult = await transaction.organization.createMany({
        data: organizations,
      });

      console.log("Seeding tournaments...");

      const tournamentRecords = tournaments.map((tournament) => ({
        id: tournament.id,
        organizationId: tournament.organizationId,
        name: tournament.name,
        slug: tournament.slug,
        logoUrl: tournament.logoUrl,
        city: tournament.city,
        state: tournament.state,
      }));

      const tournamentsResult = await transaction.tournament.createMany({
        data: tournamentRecords,
      });

      console.log("Seeding teams...");

      const teamsResult = await transaction.team.createMany({
        data: teams,
      });

      console.log("Linking tournaments and teams...");

      for (const tournament of tournaments) {
        if (tournament.teamIds.length > 0) {
          await transaction.tournament.update({
            where: { id: tournament.id },
            data: {
              teams: {
                connect: tournament.teamIds.map((teamId) => ({ id: teamId })),
              },
            },
          });
        }
      }

      console.log("Seeding players...");

      const playersResult = await transaction.player.createMany({
        data: players.map((player) => ({
          ...player,
          birthDate: player.birthDate ? new Date(player.birthDate) : null,
        })),
      });

      console.log("Seeding matches...");

      const matchesResult = await transaction.match.createMany({
        data: matches,
      });

      console.log("Seeding match players...");

      const matchPlayersResult = await transaction.matchPlayer.createMany({
        data: matchPlayersData,
      });

      console.log("Seeding match innings...");

      const matchInningsResult = await transaction.matchInning.createMany({
        data: matchInningsData,
      });

      console.log("Seeding balls...");

      let insertedBalls = 0;

      const ballChunks = createChunks(ballsData, BALL_INSERT_CHUNK_SIZE);

      for (const ballChunk of ballChunks) {
        const ballsResult = await transaction.ball.createMany({
          data: ballChunk,
        });

        insertedBalls += ballsResult.count;
      }

      return {
        users: usersResult.count,
        organizations: orgsResult.count,
        tournaments: tournamentsResult.count,
        teams: teamsResult.count,
        players: playersResult.count,
        matches: matchesResult.count,
        matchPlayers: matchPlayersResult.count,
        matchInnings: matchInningsResult.count,
        balls: insertedBalls,
      };
    },
    {
      maxWait: 10_000,
      timeout: 120_000,
    },
  );

  console.log("Database seeded successfully.");

  console.table(insertedCounts);
};

seedDatabase()
  .catch((error: unknown) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
