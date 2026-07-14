import {
  MatchFormat,
  MatchStatus,
  TossDecision,
} from "../../src/generated/prisma/enums.js";

export type matchType = {
  id: string;
  title: string;
  slug: string;
  matchFormat: MatchFormat;
  status: MatchStatus;
  matchDate: Date;
  venue: string | null;
  city: string | null;
  homeTeamId: string;
  awayTeamId: string;
  tossWinnerTeamId: string | null;
  tossDecision: TossDecision | null;
};

const matches: matchType[] = [
  {
    id: "201",
    title: "India vs England - T10",
    slug: "india-vs-england-t10",
    matchFormat: MatchFormat.T10,
    status: MatchStatus.COMPLETED,
    matchDate: new Date("2026-07-08"),
    venue: "Lord's",
    city: "London",
    homeTeamId: "102",
    awayTeamId: "101",
    tossWinnerTeamId: "101",
    tossDecision: TossDecision.BAT,
  },
  {
    id: "202",
    title: "India vs England - T10",
    slug: "india-vs-england-t10-1",
    matchFormat: MatchFormat.T10,
    status: MatchStatus.COMPLETED,
    matchDate: new Date("2026-07-09"),
    venue: "Narendra Modi Stadium",
    city: "Ahmedabad",
    homeTeamId: "101",
    awayTeamId: "102",
    tossWinnerTeamId: "101",
    tossDecision: TossDecision.BOWL,
  },
];

export default matches;
