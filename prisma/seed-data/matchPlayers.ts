import type { DismissalType } from "../../src/generated/prisma/enums.js";
import matches from "./matches.js";

export type matchPlayerType = {
  id: string;
  matchId: string;
  teamId: string;
  playerId: string;
  isPlaying: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isWicketKeeper: boolean;
  lineupOrder: number | null;
  battingOrder: number | null;
  didBat: boolean;
  runsScored: number;
  ballsFaced: number;
  battingDotBalls: number;
  singles: number;
  doubles: number;
  triples: number;
  runningFours: number;
  fours: number;
  sixes: number;
  isOut: boolean;
  dismissalType: DismissalType | null;
  didBowl: boolean;
  legalBallsBowled: number;
  bowlingDotBalls: number;
  singlesConceded: number;
  doublesConceded: number;
  triplesConceded: number;
  runningFoursConceded: number;
  foursConceded: number;
  sixesConceded: number;
  wideDeliveries: number;
  noBallDeliveries: number;
  runsConceded: number;
  maidens: number;
  wickets: number;
  twoWicketsInTwoBalls: number;
  hatTricks: number;
  fourWicketsInFourBalls: number;
  fiveWicketsInFiveBalls: number;
  sixWicketsInSixBalls: number;
  catches: number;
  catchAssists: number;
  stumpings: number;
  runOuts: number;
  runOutAssists: number;
};

// Map of team IDs to player IDs belonging to that team
const teamPlayerIdsMap: Record<string, string[]> = {
  "101": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13"], // India
  "102": [
    "14",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
  ], // England
  "103": [
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
  ], // Australia
  "104": [
    "39",
    "40",
    "41",
    "42",
    "43",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
    "50",
    "51",
  ], // New Zealand
  "105": [
    "52",
    "53",
    "54",
    "55",
    "56",
    "57",
    "58",
    "59",
    "60",
    "61",
    "62",
    "63",
    "64",
  ], // Sri Lanka
  "106": [
    "65",
    "66",
    "67",
    "68",
    "69",
    "70",
    "71",
    "72",
    "73",
    "74",
    "75",
    "76",
    "77",
  ], // South Africa
  "107": [
    "78",
    "79",
    "80",
    "81",
    "82",
    "83",
    "84",
    "85",
    "86",
    "87",
    "88",
    "89",
    "90",
  ], // West Indies
  "108": [
    "91",
    "92",
    "93",
    "94",
    "95",
    "96",
    "97",
    "98",
    "99",
    "100",
    "101",
    "102",
    "103",
  ], // Ireland
};

// Designated primary Wicket Keeper for each team in playing 11
const teamWicketKeeperMap: Record<string, string> = {
  "101": "4", // KL Rahul
  "102": "15", // Jos Buttler
  "103": "33", // Alex Carey
  "104": "40", // Devon Conway
  "105": "53", // Kusal Mendis
  "106": "66", // Quinton de Kock
  "107": "78", // Shai Hope
  "108": "94", // Lorcan Tucker
};

const defaultStats = {
  battingOrder: null,
  didBat: false,
  runsScored: 0,
  ballsFaced: 0,
  battingDotBalls: 0,
  singles: 0,
  doubles: 0,
  triples: 0,
  runningFours: 0,
  fours: 0,
  sixes: 0,
  isOut: false,
  dismissalType: null as DismissalType | null,
  didBowl: false,
  legalBallsBowled: 0,
  bowlingDotBalls: 0,
  singlesConceded: 0,
  doublesConceded: 0,
  triplesConceded: 0,
  runningFoursConceded: 0,
  foursConceded: 0,
  sixesConceded: 0,
  wideDeliveries: 0,
  noBallDeliveries: 0,
  runsConceded: 0,
  maidens: 0,
  wickets: 0,
  twoWicketsInTwoBalls: 0,
  hatTricks: 0,
  fourWicketsInFourBalls: 0,
  fiveWicketsInFiveBalls: 0,
  sixWicketsInSixBalls: 0,
  catches: 0,
  catchAssists: 0,
  stumpings: 0,
  runOuts: 0,
  runOutAssists: 0,
};

const generateMatchPlayers = (): matchPlayerType[] => {
  const result: matchPlayerType[] = [];
  let currentId = 301;

  for (const match of matches) {
    const teamsInMatch = [match.homeTeamId, match.awayTeamId];

    for (const teamId of teamsInMatch) {
      const playerIds = teamPlayerIdsMap[teamId] ?? [];
      const primaryWkId = teamWicketKeeperMap[teamId];

      playerIds.forEach((playerId, index) => {
        const isPlaying = index < 11;
        const lineupOrder = isPlaying ? index + 1 : null;
        const isCaptain = isPlaying && index === 0;
        const isViceCaptain = isPlaying && index === 1;
        const isWicketKeeper = isPlaying && playerId === primaryWkId;

        result.push({
          id: String(currentId++),
          matchId: match.id,
          teamId,
          playerId,
          isPlaying,
          isCaptain,
          isViceCaptain,
          isWicketKeeper,
          lineupOrder,
          ...defaultStats,
        });
      });
    }
  }

  return result;
};

const matchPlayers: matchPlayerType[] = generateMatchPlayers();

export default matchPlayers;
