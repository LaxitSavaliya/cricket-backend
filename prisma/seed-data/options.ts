import type { MatchGenerationOptions } from "../seed-utils/generate-matchData.js";

export const matchGenerationOptions = {
  maxOvers: 10,
  maxBowlerOvers: 3,
  expectedPlayingPlayersPerTeam: 11,
  inningIdStart: 401,
  ballIdStart: 501,
  random: Math.random,
} satisfies MatchGenerationOptions;
