import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "./app.js";

/*
|--------------------------------------------------------------------------
| Prisma mock
|--------------------------------------------------------------------------
*/

const { findManyMock, findUniqueMock } = vi.hoisted(() => ({
  findManyMock: vi.fn(),
  findUniqueMock: vi.fn(),
}));

vi.mock("./config/prisma.js", () => ({
  prisma: {
    match: {
      findMany: findManyMock,
      findUnique: findUniqueMock,
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
|
| These objects must match the data selected by Prisma.
| They should not contain the final formatted API response.
|
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
        playerName: "Rohit Sharma",
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
        playerName: "Hardik Pandya",
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
        playerName: "Arjun Tendulkar",
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
        playerName: "MS Dhoni",
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
        playerName: "Tushar Deshpande",
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
        playerName: "Rohit Sharma",
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
        playerName: "MS Dhoni",
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
              playerName: "MS Dhoni",
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
              playerName: "Rohit Sharma",
              displayName: "Rohit",
              role: "BATSMAN",
              photoUrl: "https://example.com/rohit-sharma.png",
              isCaptain: true,
              isViceCaptain: false,
            },
            {
              id: "player-home-2",
              playerName: "Hardik Pandya",
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
              playerName: "Arjun Tendulkar",
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
              playerName: "MS Dhoni",
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
              playerName: "Tushar Deshpande",
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
