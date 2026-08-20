import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "./app.js";

/*
|--------------------------------------------------------------------------
| Prisma mock
|--------------------------------------------------------------------------
*/

const {
  findManyMock,
  findUniqueMock,
  matchPlayerCountMock,
  matchPlayerAggregateMock,
  matchPlayerFindFirstMock,
} = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
  matchPlayerCountMock: vi.fn(),
  matchPlayerAggregateMock: vi.fn(),
  matchPlayerFindFirstMock: vi.fn(),
}));

vi.mock("./config/prisma.js", () => ({
  prisma: {
    match: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
    },
    matchPlayer: {
      count: matchPlayerCountMock,
      aggregate: matchPlayerAggregateMock,
      findFirst: matchPlayerFindFirstMock,
    },
  },
}));

/*
|--------------------------------------------------------------------------
| Shared test data
|--------------------------------------------------------------------------
*/

const matchId = "match-202";
const matchSlug = "mumbai-indians-vs-chennai-super-kings-t20";

const homeTeamId = "team-home-101";
const awayTeamId = "team-away-102";

const homeTeam = {
  id: homeTeamId,
  teamName: "Mumbai Indians",
  slug: "mumbai-indians",
  logoUrl: "https://example.com/mumbai-indians.png",
};

const awayTeam = {
  id: awayTeamId,
  teamName: "Chennai Super Kings",
  slug: "chennai-super-kings",
  logoUrl: null,
};

const matchDate = new Date("2026-07-09T00:00:00.000Z");

/*
|--------------------------------------------------------------------------
| Raw Prisma results
|--------------------------------------------------------------------------
*/

const matchListQueryResult = {
  id: matchId,
  title: "Mumbai Indians vs Chennai Super Kings - T20",
  slug: matchSlug,
  matchFormat: "T20",
  status: "COMPLETED",
  matchDate,

  homeTeamId,
  awayTeamId,

  tossWinnerTeamId: homeTeamId,
  tossDecision: "BAT",

  homeTeam,
  awayTeam,

  innings: [
    {
      teamId: homeTeamId,
      inningsNo: "FIRST",
      runs: 186,
      wickets: 5,
      balls: 120,
    },
    {
      teamId: awayTeamId,
      inningsNo: "SECOND",
      runs: 178,
      wickets: 8,
      balls: 120,
    },
  ],
};

const matchDetailsQueryResult = {
  id: matchId,
  title: "Mumbai Indians vs Chennai Super Kings - T20",
  slug: matchSlug,
  matchFormat: "T20",
  status: "COMPLETED",
  matchDate,
  venue: "Wankhede Stadium",
  city: "Mumbai",
  tossWinnerTeamId: homeTeamId,
  tossDecision: "BAT",
  homeTeam,
  awayTeam,
};

const matchPlayersQueryResult = {
  homeTeam,
  awayTeam,

  players: [
    {
      teamId: homeTeamId,
      isPlaying: true,
      isCaptain: true,
      isViceCaptain: false,
      player: {
        id: "player-home-1",
        name: "Rohit Sharma",
        displayName: "Rohit",
        role: "BATSMAN",
        photoUrl: "https://example.com/rohit-sharma.png",
      },
    },
    {
      teamId: homeTeamId,
      isPlaying: true,
      isCaptain: false,
      isViceCaptain: true,
      player: {
        id: "player-home-2",
        name: "Hardik Pandya",
        displayName: null,
        role: "ALL_ROUNDER",
        photoUrl: null,
      },
    },
    {
      teamId: homeTeamId,
      isPlaying: false,
      isCaptain: false,
      isViceCaptain: false,
      player: {
        id: "player-home-3",
        name: "Arjun Tendulkar",
        displayName: "   ",
        role: "BOWLER",
        photoUrl: null,
      },
    },
    {
      teamId: awayTeamId,
      isPlaying: true,
      isCaptain: true,
      isViceCaptain: false,
      player: {
        id: "player-away-1",
        name: "MS Dhoni",
        displayName: "Dhoni",
        role: "BATSMAN",
        photoUrl: "https://example.com/ms-dhoni.png",
      },
    },
    {
      teamId: awayTeamId,
      isPlaying: false,
      isCaptain: false,
      isViceCaptain: false,
      player: {
        id: "player-away-2",
        name: "Tushar Deshpande",
        displayName: null,
        role: "BOWLER",
        photoUrl: null,
      },
    },
  ],
};

const matchScoreQueryResult = {
  players: [
    {
      id: "match-player-home-1",
      teamId: homeTeamId,
      isPlaying: true,
      didBat: true,
      runsScored: 45,
      ballsFaced: 30,
      fours: 4,
      sixes: 2,
      isOut: true,
      dismissalType: "BOWLED",
      didBowl: false,
      legalBallsBowled: 0,
      maidens: 0,
      runsConceded: 0,
      wickets: 0,
      player: {
        name: "Rohit Sharma",
        slug: "rohit-sharma",
      },
    },
    {
      id: "match-player-away-1",
      teamId: awayTeamId,
      isPlaying: true,
      didBat: false,
      runsScored: 0,
      ballsFaced: 0,
      fours: 0,
      sixes: 0,
      isOut: false,
      dismissalType: null,
      didBowl: true,
      legalBallsBowled: 24,
      maidens: 0,
      runsConceded: 25,
      wickets: 2,
      player: {
        name: "MS Dhoni",
        slug: "ms-dhoni",
      },
    },
  ],
  innings: [
    {
      id: "inning-1",
      teamId: homeTeamId,
      inningsNo: "FIRST",
      runs: 186,
      wickets: 5,
      balls: 120,
      team: homeTeam,
      ballsData: [
        {
          deliveryNo: 1,
          overNo: 0,
          ballNo: 1,
          strikerMatchPlayerId: "match-player-home-1",
          nonStrikerMatchPlayerId: "match-player-home-2",
          bowlerMatchPlayerId: "match-player-away-1",
          isLegalDelivery: true,
          isDeadBall: false,
          isWide: false,
          isNoBall: false,
          isWicket: false,
          batterRuns: 4,
          noBallRuns: 0,
          wideRuns: 0,
          byeRuns: 0,
          legByeRuns: 0,
          penaltyRuns: 0,
          totalRuns: 4,
          dismissalType: null,
          dismissedMatchPlayerId: null,
          fielderMatchPlayerId: null,
          assistFielderMatchPlayerId: null,
          bowlerMatchPlayer: {
            player: {
              name: "MS Dhoni",
              slug: "ms-dhoni",
            },
          },
          fielderMatchPlayer: null,
          assistFielderMatchPlayer: null,
        },
      ],
    },
  ],
};

const matchCommentaryQueryResult = {
  id: matchId,
  slug: matchSlug,
  matchFormat: "T20",
  matchDate,
  innings: [
    {
      id: "inning-1",
      inningsNo: "FIRST",
      ballsData: [
        {
          deliveryNo: 6,
          overNo: 0,
          ballNo: 6,
          commentaryText: "Bumrah to Rohit, OUT!",
          isWide: false,
          isNoBall: false,
          isWicket: true,
          batterRuns: 0,
          wideRuns: 0,
          noBallRuns: 0,
          byeRuns: 0,
          legByeRuns: 0,
          totalRuns: 0,
          strikerMatchPlayer: {
            playerId: "player-home-1",
            player: {
              name: "Rohit Sharma",
              slug: "rohit-sharma",
              photoUrl: "https://example.com/rohit-sharma.png",
            },
          },
          nonStrikerMatchPlayer: {
            playerId: "player-home-2",
            player: {
              name: "Hardik Pandya",
              slug: "hardik-pandya",
              photoUrl: null,
            },
          },
          bowlerMatchPlayer: {
            playerId: "player-away-1",
            player: {
              name: "Jasprit Bumrah",
              slug: "jasprit-bumrah",
              photoUrl: "https://example.com/bumrah.png",
            },
          },
          dismissedMatchPlayer: {
            playerId: "player-home-1",
            player: {
              name: "Rohit Sharma",
              slug: "rohit-sharma",
              photoUrl: "https://example.com/rohit-sharma.png",
            },
          },
        },
        ...[1, 2, 3, 4, 5].map((ballNo) => ({
          deliveryNo: ballNo,
          overNo: 0,
          ballNo,
          commentaryText: `Bumrah to Rohit, 1 run`,
          isWide: false,
          isNoBall: false,
          isWicket: false,
          batterRuns: 1,
          wideRuns: 0,
          noBallRuns: 0,
          byeRuns: 0,
          legByeRuns: 0,
          totalRuns: 1,
          strikerMatchPlayer: {
            playerId: "player-home-1",
            player: {
              name: "Rohit Sharma",
              slug: "rohit-sharma",
              photoUrl: "https://example.com/rohit-sharma.png",
            },
          },
          nonStrikerMatchPlayer: {
            playerId: "player-home-2",
            player: {
              name: "Hardik Pandya",
              slug: "hardik-pandya",
              photoUrl: null,
            },
          },
          bowlerMatchPlayer: {
            playerId: "player-away-1",
            player: {
              name: "Jasprit Bumrah",
              slug: "jasprit-bumrah",
              photoUrl: "https://example.com/bumrah.png",
            },
          },
          dismissedMatchPlayer: null,
        })),
      ],
    },
  ],
};

/*
|--------------------------------------------------------------------------
| Setup
|--------------------------------------------------------------------------
*/

beforeEach(() => {
  vi.clearAllMocks();
});

/*
|--------------------------------------------------------------------------
| GET /health
|--------------------------------------------------------------------------
*/

describe("GET /health", () => {
  it("returns server health status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Service healthy");
    expect(response.body.data).toHaveProperty("uptime");
    expect(response.body.data).toHaveProperty("timestamp");
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/v1/matches
|--------------------------------------------------------------------------
*/

describe("GET /api/v1/matches", () => {
  it("returns an empty array when no matches exist", async () => {
    findManyMock.mockResolvedValueOnce([]);

    const response = await request(app).get("/api/v1/matches");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Matches fetched successfully.",
      data: [],
    });

    expect(findManyMock).toHaveBeenCalledOnce();

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: {
          matchDate: "desc",
        },
      }),
    );

    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns formatted matches with team innings summaries", async () => {
    findManyMock.mockResolvedValueOnce([matchListQueryResult]);

    const response = await request(app).get("/api/v1/matches");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Matches fetched successfully.",
      data: [
        {
          id: matchId,
          title: "Mumbai Indians vs Chennai Super Kings - T20",
          slug: matchSlug,
          matchFormat: "T20",
          status: "COMPLETED",
          matchDate: "2026-07-09T00:00:00.000Z",
          tossWinnerTeamId: homeTeamId,
          tossDecision: "BAT",
          result: {
            type: "RUNS",
            winnerTeamId: homeTeamId,
            margin: 8,
            text: "Mumbai Indians won by 8 runs",
          },

          homeTeam: {
            id: homeTeamId,
            teamName: "Mumbai Indians",
            shortName: "MI",
            slug: "mumbai-indians",
            logoUrl: "https://example.com/mumbai-indians.png",
            inningsNo: "FIRST",
            runs: 186,
            wickets: 5,
            balls: 120,
          },

          awayTeam: {
            id: awayTeamId,
            teamName: "Chennai Super Kings",
            shortName: "CSK",
            slug: "chennai-super-kings",
            logoUrl: null,
            inningsNo: "SECOND",
            runs: 178,
            wickets: 8,
            balls: 120,
          },
        },
      ],
    });

    expect(response.body.data[0]).not.toHaveProperty("homeTeamId");
    expect(response.body.data[0]).not.toHaveProperty("awayTeamId");
    expect(response.body.data[0]).not.toHaveProperty("innings");
    expect(response.body.data[0]).not.toHaveProperty("createdAt");
    expect(response.body.data[0]).not.toHaveProperty("updatedAt");

    expect(findManyMock).toHaveBeenCalledOnce();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });

  it("returns default score values when innings have not been created", async () => {
    findManyMock.mockResolvedValueOnce([
      {
        ...matchListQueryResult,
        status: "UPCOMING",
        tossWinnerTeamId: null,
        tossDecision: null,
        innings: [],
      },
    ]);

    const response = await request(app).get("/api/v1/matches");

    expect(response.status).toBe(200);

    expect(response.body.data[0].homeTeam).toEqual({
      id: homeTeamId,
      teamName: "Mumbai Indians",
      shortName: "MI",
      slug: "mumbai-indians",
      logoUrl: "https://example.com/mumbai-indians.png",
      inningsNo: null,
      runs: 0,
      wickets: 0,
      balls: 0,
    });

    expect(response.body.data[0].awayTeam).toEqual({
      id: awayTeamId,
      teamName: "Chennai Super Kings",
      shortName: "CSK",
      slug: "chennai-super-kings",
      logoUrl: null,
      inningsNo: null,
      runs: 0,
      wickets: 0,
      balls: 0,
    });
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/v1/matches/:slug
|--------------------------------------------------------------------------
*/

describe("GET /api/v1/matches/:slug", () => {
  it("returns match details for a valid slug", async () => {
    findUniqueMock.mockResolvedValueOnce(matchDetailsQueryResult);

    const response = await request(app).get(`/api/v1/matches/${matchSlug}`);

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Match fetched successfully.",
      data: {
        id: matchId,
        title: "Mumbai Indians vs Chennai Super Kings - T20",
        slug: matchSlug,
        matchFormat: "T20",
        status: "COMPLETED",
        matchDate: "2026-07-09T00:00:00.000Z",
        venue: "Wankhede Stadium",
        city: "Mumbai",
        tossWinnerTeamId: homeTeamId,
        tossDecision: "BAT",

        homeTeam: {
          id: homeTeamId,
          teamName: "Mumbai Indians",
          shortName: "MI",
          slug: "mumbai-indians",
          logoUrl: "https://example.com/mumbai-indians.png",
        },

        awayTeam: {
          id: awayTeamId,
          teamName: "Chennai Super Kings",
          shortName: "CSK",
          slug: "chennai-super-kings",
          logoUrl: null,
        },
      },
    });

    expect(findUniqueMock).toHaveBeenCalledOnce();

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: matchSlug,
        },
      }),
    );

    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("supports nullable venue, city and toss fields", async () => {
    findUniqueMock.mockResolvedValueOnce({
      ...matchDetailsQueryResult,
      venue: null,
      city: null,
      tossWinnerTeamId: null,
      tossDecision: null,
    });

    const response = await request(app).get(`/api/v1/matches/${matchSlug}`);

    expect(response.status).toBe(200);
    expect(response.body.data.venue).toBeNull();
    expect(response.body.data.city).toBeNull();
    expect(response.body.data.tossWinnerTeamId).toBeNull();
    expect(response.body.data.tossDecision).toBeNull();
  });

  it("returns 404 when the match does not exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const response = await request(app).get("/api/v1/matches/unknown-match");

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Match not found.",
      data: null,
    });

    expect(findUniqueMock).toHaveBeenCalledOnce();

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: "unknown-match",
        },
      }),
    );
  });

  it("does not expose database timestamps or internal team IDs", async () => {
    findUniqueMock.mockResolvedValueOnce(matchDetailsQueryResult);

    const response = await request(app).get(`/api/v1/matches/${matchSlug}`);

    expect(response.status).toBe(200);

    expect(response.body.data).not.toHaveProperty("homeTeamId");
    expect(response.body.data).not.toHaveProperty("awayTeamId");
    expect(response.body.data).not.toHaveProperty("createdAt");
    expect(response.body.data).not.toHaveProperty("updatedAt");

    expect(response.body.data.homeTeam).not.toHaveProperty("createdAt");
    expect(response.body.data.homeTeam).not.toHaveProperty("updatedAt");

    expect(response.body.data.awayTeam).not.toHaveProperty("createdAt");
    expect(response.body.data.awayTeam).not.toHaveProperty("updatedAt");
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/v1/matches/:slug/players
|--------------------------------------------------------------------------
*/

describe("GET /api/v1/matches/:slug/players", () => {
  it("returns playing and bench players grouped by team", async () => {
    findUniqueMock.mockResolvedValueOnce(matchPlayersQueryResult);

    const response = await request(app).get(
      `/api/v1/matches/${matchSlug}/players`,
    );

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Match players fetched successfully.",
      data: {
        homeTeam: {
          id: homeTeamId,
          teamName: "Mumbai Indians",
          shortName: "MI",
          slug: "mumbai-indians",
          logoUrl: "https://example.com/mumbai-indians.png",

          players: [
            {
              id: "player-home-1",
              name: "Rohit Sharma",
              displayName: "Rohit",
              role: "BATSMAN",
              photoUrl: "https://example.com/rohit-sharma.png",
              isCaptain: true,
              isViceCaptain: false,
            },
            {
              id: "player-home-2",
              name: "Hardik Pandya",
              displayName: "Hardik Pandya",
              role: "ALL_ROUNDER",
              photoUrl: null,
              isCaptain: false,
              isViceCaptain: true,
            },
          ],

          benchPlayers: [
            {
              id: "player-home-3",
              name: "Arjun Tendulkar",
              displayName: "Arjun Tendulkar",
              role: "BOWLER",
              photoUrl: null,
              isCaptain: false,
              isViceCaptain: false,
            },
          ],
        },

        awayTeam: {
          id: awayTeamId,
          teamName: "Chennai Super Kings",
          shortName: "CSK",
          slug: "chennai-super-kings",
          logoUrl: null,

          players: [
            {
              id: "player-away-1",
              name: "MS Dhoni",
              displayName: "Dhoni",
              role: "BATSMAN",
              photoUrl: "https://example.com/ms-dhoni.png",
              isCaptain: true,
              isViceCaptain: false,
            },
          ],

          benchPlayers: [
            {
              id: "player-away-2",
              name: "Tushar Deshpande",
              displayName: "Tushar Deshpande",
              role: "BOWLER",
              photoUrl: null,
              isCaptain: false,
              isViceCaptain: false,
            },
          ],
        },
      },
    });

    expect(findUniqueMock).toHaveBeenCalledOnce();

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: matchSlug,
        },
      }),
    );

    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("returns empty player arrays when no players are assigned", async () => {
    findUniqueMock.mockResolvedValueOnce({
      homeTeam,
      awayTeam,
      players: [],
    });

    const response = await request(app).get(
      `/api/v1/matches/${matchSlug}/players`,
    );

    expect(response.status).toBe(200);

    expect(response.body.data.homeTeam.players).toEqual([]);
    expect(response.body.data.homeTeam.benchPlayers).toEqual([]);
    expect(response.body.data.awayTeam.players).toEqual([]);
    expect(response.body.data.awayTeam.benchPlayers).toEqual([]);
  });

  it("returns the full team name for a single-word team name", async () => {
    findUniqueMock.mockResolvedValueOnce({
      homeTeam: {
        ...homeTeam,
        teamName: "India",
      },
      awayTeam: {
        ...awayTeam,
        teamName: "England",
      },
      players: [],
    });

    const response = await request(app).get(
      `/api/v1/matches/${matchSlug}/players`,
    );

    expect(response.status).toBe(200);
    expect(response.body.data.homeTeam.shortName).toBe("IND");
    expect(response.body.data.awayTeam.shortName).toBe("ENG");
  });

  it("falls back to playerName when displayName is null or blank", async () => {
    findUniqueMock.mockResolvedValueOnce(matchPlayersQueryResult);

    const response = await request(app).get(
      `/api/v1/matches/${matchSlug}/players`,
    );

    expect(response.status).toBe(200);

    const homeTeamPlayers = response.body.data.homeTeam.players;
    const homeTeamBenchPlayers = response.body.data.homeTeam.benchPlayers;

    expect(homeTeamPlayers[1].displayName).toBe("Hardik Pandya");
    expect(homeTeamBenchPlayers[0].displayName).toBe("Arjun Tendulkar");
  });

  it("returns 404 when the match does not exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const response = await request(app).get(
      "/api/v1/matches/unknown-match/players",
    );

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Match not found.",
      data: null,
    });

    expect(findUniqueMock).toHaveBeenCalledOnce();

    expect(findUniqueMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          slug: "unknown-match",
        },
      }),
    );
  });

  it("does not expose MatchPlayer internal fields", async () => {
    findUniqueMock.mockResolvedValueOnce(matchPlayersQueryResult);

    const response = await request(app).get(
      `/api/v1/matches/${matchSlug}/players`,
    );

    expect(response.status).toBe(200);

    const player = response.body.data.homeTeam.players[0];

    expect(player).not.toHaveProperty("teamId");
    expect(player).not.toHaveProperty("isPlaying");
    expect(player).not.toHaveProperty("createdAt");
    expect(player).not.toHaveProperty("updatedAt");
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/v1/matches/:slug/score
|--------------------------------------------------------------------------
*/

describe("GET /api/v1/matches/:slug/score", () => {
  it("returns match score details for a valid slug", async () => {
    findUniqueMock.mockResolvedValueOnce(matchScoreQueryResult);

    const response = await request(app).get(
      `/api/v1/matches/${matchSlug}/score`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Match score fetched successfully.");
    expect(response.body.data.firstInning).not.toBeNull();
    expect(response.body.data.secondInning).toBeNull();
  });

  it("returns 404 when the match does not exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const response = await request(app).get(
      "/api/v1/matches/unknown-match/score",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Match not found.");
  });
});

/*
|--------------------------------------------------------------------------
| GET /api/v1/matches/:slug/commentary
|--------------------------------------------------------------------------
*/

describe("GET /api/v1/matches/:slug/commentary", () => {
  it("returns match commentary with batterIntro and bowlerIntro for a valid slug", async () => {
    findUniqueMock.mockResolvedValueOnce(matchCommentaryQueryResult);
    matchPlayerCountMock.mockResolvedValue(10);
    matchPlayerAggregateMock.mockResolvedValue({
      _sum: {
        runsScored: 250,
        ballsFaced: 180,
        wickets: 15,
        runsConceded: 300,
        legalBallsBowled: 240,
      },
    });
    matchPlayerFindFirstMock.mockResolvedValue({
      runsScored: 85,
      isOut: false,
      wickets: 4,
      runsConceded: 20,
    });

    const response = await request(app).get(
      `/api/v1/matches/${matchSlug}/commentary`,
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Match commentary fetched successfully.",
    );

    const { firstInning, secondInning } = response.body.data;
    expect(firstInning).not.toBeNull();
    expect(secondInning).toBeNull();

    expect(firstInning.batterIntro).toBeInstanceOf(Array);
    expect(firstInning.bowlerIntro).toBeInstanceOf(Array);
    expect(firstInning.commentary).toBeInstanceOf(Array);
    expect(firstInning.overSummaries).toBeInstanceOf(Array);

    if (firstInning.batterIntro.length > 0) {
      const batter = firstInning.batterIntro[0];
      expect(batter).toHaveProperty("name");
      expect(batter).toHaveProperty("slug");
      expect(batter).toHaveProperty("deliveryNo");
      expect(batter).toHaveProperty("matches");
      expect(batter).toHaveProperty("runs");
      expect(batter).toHaveProperty("strikeRate");
      expect(batter).toHaveProperty("average");
      expect(batter).toHaveProperty("best");
    }

    if (firstInning.bowlerIntro.length > 0) {
      const bowler = firstInning.bowlerIntro[0];
      expect(bowler).toHaveProperty("name");
      expect(bowler).toHaveProperty("slug");
      expect(bowler).toHaveProperty("deliveryNo");
      expect(bowler).toHaveProperty("matches");
      expect(bowler).toHaveProperty("wickets");
      expect(bowler).toHaveProperty("average");
      expect(bowler).toHaveProperty("economy");
      expect(bowler).toHaveProperty("best");
    }

    if (firstInning.overSummaries.length > 0) {
      const overSummary = firstInning.overSummaries[0];
      expect(overSummary).toHaveProperty("overNo", 1);
      expect(overSummary).toHaveProperty("runs", 5);
      expect(overSummary).toHaveProperty("wickets", 1);
      expect(overSummary).toHaveProperty("battersOnCrease");
      expect(overSummary.bowler).toEqual({
        name: "Jasprit Bumrah",
        slug: "jasprit-bumrah",
        runs: 5,
        overs: "1.0",
      });
    }
  });

  it("returns 404 when the match commentary does not exist", async () => {
    findUniqueMock.mockResolvedValueOnce(null);

    const response = await request(app).get(
      "/api/v1/matches/unknown-match/commentary",
    );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe("Match not found.");
  });
});

/*
|--------------------------------------------------------------------------
| Route safety
|--------------------------------------------------------------------------
*/

describe("Match route safety", () => {
  it("does not treat the players route as a normal match-detail route", async () => {
    findUniqueMock.mockResolvedValueOnce(matchPlayersQueryResult);

    const response = await request(app).get(
      `/api/v1/matches/${matchSlug}/players`,
    );

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Match players fetched successfully.");

    expect(findUniqueMock).toHaveBeenCalledOnce();
  });

  it("returns 404 for unsupported match methods", async () => {
    const response = await request(app).post("/api/v1/matches");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "Route POST /api/v1/matches not found",
    );

    expect(findManyMock).not.toHaveBeenCalled();
    expect(findUniqueMock).not.toHaveBeenCalled();
  });
});
