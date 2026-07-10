import {
  MatchInningNo,
  MatchInningStatus,
} from "../../src/generated/prisma/enums";

type matchInning = {
  id: string;
  matchId: string;
  teamId: string;
  inningsNo: MatchInningNo;
  runs: number;
  wickets: number;
  balls: number;
  maxOvers: number;
  status: MatchInningStatus;
  target: number | null;
};

const matchInnings: matchInning[] = [
  {
    id: "401",
    matchId: "201",
    teamId: "101",
    inningsNo: MatchInningNo.FIRST,
    runs: 0,
    wickets: 0,
    balls: 0,
    maxOvers: 10,
    status: MatchInningStatus.COMPLETED,
    target: null,
  },
  {
    id: "402",
    matchId: "201",
    teamId: "102",
    inningsNo: MatchInningNo.SECOND,
    runs: 0,
    wickets: 0,
    balls: 0,
    maxOvers: 20,
    status: MatchInningStatus.COMPLETED,
    target: null,
  },

  {
    id: "403",
    matchId: "202",
    teamId: "102",
    inningsNo: MatchInningNo.FIRST,
    runs: 0,
    wickets: 0,
    balls: 0,
    maxOvers: 10,
    status: MatchInningStatus.COMPLETED,
    target: null,
  },
  {
    id: "404",
    matchId: "202",
    teamId: "101",
    inningsNo: MatchInningNo.SECOND,
    runs: 0,
    wickets: 0,
    balls: 0,
    maxOvers: 20,
    status: MatchInningStatus.COMPLETED,
    target: null,
  },
];

export default matchInnings;
