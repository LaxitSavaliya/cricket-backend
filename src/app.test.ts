import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockTeamHome = {
  id: "team-home-1",
  teamName: "Mumbai Indians",
  shortName: "MI",
  logoUrl: "https://example.com/mi.png",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockTeamAway = {
  id: "team-away-1",
  teamName: "Chennai Super Kings",
  shortName: "CSK",
  logoUrl: "https://example.com/csk.png",
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};

const mockMatch = {
  id: "match-1",
  title: "MI vs CSK",
  matchFormat: "T20",
  status: "COMPLETED",
  matchDate: new Date("2024-06-15"),
  matchTextResult: "MI won by 5 wickets",
  resultType: "NORMAL",
  tossDecision: "BAT",
  firstIningRuns: 180,
  firstIningWickets: 7,
  firstIningOvers: 20,
  secondIningRuns: 181,
  secondIningWickets: 5,
  secondIningOvers: 19,
  homeTeamId: "team-home-1",
  awayTeamId: "team-away-1",
  tossWinnerTeamId: "team-home-1",
  winnerTeamId: "team-home-1",
  createdAt: new Date("2024-06-15"),
  updatedAt: new Date("2024-06-15"),
  homeTeam: mockTeamHome,
  awayTeam: mockTeamAway,
  tossWinnerTeam: mockTeamHome,
  winnerTeam: mockTeamHome,
};

const mockMatchListItem = {
  id: "match-1",
  title: "MI vs CSK",
  matchFormat: "T20",
  status: "COMPLETED",
  matchDate: new Date("2024-06-15"),
  matchTextResult: "MI won by 5 wickets",
  resultType: "NORMAL",
  tossDecision: "BAT",
  firstIningRuns: 180,
  firstIningWickets: 7,
  firstIningOvers: 20,
  secondIningRuns: 181,
  secondIningWickets: 5,
  secondIningOvers: 19,
  createdAt: new Date("2024-06-15"),
  updatedAt: new Date("2024-06-15"),
  homeTeam: {
    id: "team-home-1",
    teamName: "Mumbai Indians",
    shortName: "MI",
    logoUrl: "https://example.com/mi.png",
  },
  awayTeam: {
    id: "team-away-1",
    teamName: "Chennai Super Kings",
    shortName: "CSK",
    logoUrl: "https://example.com/csk.png",
  },
  tossWinnerTeam: {
    id: "team-home-1",
    teamName: "Mumbai Indians",
    shortName: "MI",
    logoUrl: "https://example.com/mi.png",
  },
  winnerTeam: {
    id: "team-home-1",
    teamName: "Mumbai Indians",
    shortName: "MI",
    logoUrl: "https://example.com/mi.png",
  },
};

const mockMatchPlayersData = {
  homeTeamId: "team-home-1",
  awayTeamId: "team-away-1",
  homeTeam: {
    teamName: "Mumbai Indians",
    shortName: "MI",
    logoUrl: "https://example.com/mi.png",
  },
  awayTeam: {
    teamName: "Chennai Super Kings",
    shortName: "CSK",
    logoUrl: "https://example.com/csk.png",
  },
  matchPlayers: [
    {
      teamId: "team-home-1",
      isPlayingEleven: true,
      order: 1,
      battingOrder: 1,
      player: {
        id: "player-1",
        playerName: "rohit_sharma",
        role: "BATSMAN",
        photoUrl: "https://example.com/rohit.png",
        displayName: "Rohit Sharma",
      },
    },
    {
      teamId: "team-home-1",
      isPlayingEleven: false,
      order: null,
      battingOrder: null,
      player: {
        id: "player-2",
        playerName: "arjun_tendulkar",
        role: "BOWLER",
        photoUrl: null,
        displayName: "Arjun Tendulkar",
      },
    },
    {
      teamId: "team-away-1",
      isPlayingEleven: true,
      order: 1,
      battingOrder: 1,
      player: {
        id: "player-3",
        playerName: "ms_dhoni",
        role: "WICKET_KEEPER",
        photoUrl: "https://example.com/dhoni.png",
        displayName: "MS Dhoni",
      },
    },
    {
      teamId: "team-away-1",
      isPlayingEleven: false,
      order: null,
      battingOrder: null,
      player: {
        id: "player-4",
        playerName: "tushar_deshpande",
        role: "BOWLER",
        photoUrl: null,
        displayName: "Tushar Deshpande",
      },
    },
  ],
};

// ─── Prisma Mock ─────────────────────────────────────────────────────────────

const { findMany, findUnique } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock("./config/prisma.js", () => ({
  prisma: {
    match: {
      findMany,
      findUnique,
    },
  },
}));

import app from "./app.js";

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Health Routes", () => {
  it("GET / should return running status", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Cricket backend API is running",
    });
  });

  it("GET /health should return service health info", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Service healthy");
    expect(response.body.data.environment).toBeDefined();
    expect(response.body.data.uptime).toBeTypeOf("number");
    expect(response.body.data.timestamp).toBeDefined();
  });
});

describe("API V1 Routes", () => {
  it("GET /api/v1 should return API v1 running status", async () => {
    const response = await request(app).get("/api/v1");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: "Cricket API v1 is running",
    });
  });
});

describe("Match Routes", () => {
  describe("GET /api/v1/matches", () => {
    it("should return an empty list when no matches exist", async () => {
      findMany.mockResolvedValueOnce([]);

      const response = await request(app).get("/api/v1/matches");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "Matches fetched successfully",
        data: [],
      });
      expect(findMany).toHaveBeenCalledOnce();
    });

    it("should return a list of matches", async () => {
      findMany.mockResolvedValueOnce([mockMatchListItem]);

      const response = await request(app).get("/api/v1/matches");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Matches fetched successfully");
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].id).toBe("match-1");
      expect(response.body.data[0].title).toBe("MI vs CSK");
      expect(response.body.data[0].homeTeam.shortName).toBe("MI");
      expect(response.body.data[0].awayTeam.shortName).toBe("CSK");
    });
  });

  describe("GET /api/v1/matches/:id", () => {
    it("should return match details for a valid ID", async () => {
      findUnique.mockResolvedValueOnce(mockMatch);

      const response = await request(app).get("/api/v1/matches/match-1");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Match fetched successfully");
      expect(response.body.data.id).toBe("match-1");
      expect(response.body.data.title).toBe("MI vs CSK");
      expect(response.body.data.homeTeam.teamName).toBe("Mumbai Indians");
      expect(response.body.data.awayTeam.teamName).toBe("Chennai Super Kings");
      expect(response.body.data.matchFormat).toBe("T20");
      expect(response.body.data.status).toBe("COMPLETED");
      expect(findUnique).toHaveBeenCalledOnce();
    });

    it("should return 404 for a non-existent match ID", async () => {
      findUnique.mockResolvedValueOnce(null);

      const response = await request(app).get(
        "/api/v1/matches/non-existent-id",
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("GET /api/v1/matches/:id/players", () => {
    it("should return players grouped by team with playing/bench split", async () => {
      findUnique.mockResolvedValueOnce(mockMatchPlayersData);

      const response = await request(app).get(
        "/api/v1/matches/match-1/players",
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Players fetched successfully");

      const { teams } = response.body.data;

      // Home team info
      expect(teams.homeTeam.id).toBe("team-home-1");
      expect(teams.homeTeam.teamName).toBe("Mumbai Indians");
      expect(teams.homeTeam.shortName).toBe("MI");
      expect(teams.homeTeam.logoUrl).toBe("https://example.com/mi.png");

      // Home team playing players
      expect(teams.homeTeam.players.playingPlayers).toHaveLength(1);
      expect(teams.homeTeam.players.playingPlayers[0]).toEqual({
        id: "player-1",
        playerName: "rohit_sharma",
        role: "BATSMAN",
        photoUrl: "https://example.com/rohit.png",
        displayName: "Rohit Sharma",
      });

      // Home team bench players
      expect(teams.homeTeam.players.benchPlayers).toHaveLength(1);
      expect(teams.homeTeam.players.benchPlayers[0]).toEqual({
        id: "player-2",
        playerName: "arjun_tendulkar",
        role: "BOWLER",
        photoUrl: null,
        displayName: "Arjun Tendulkar",
      });

      // Away team info
      expect(teams.awayTeam.id).toBe("team-away-1");
      expect(teams.awayTeam.teamName).toBe("Chennai Super Kings");
      expect(teams.awayTeam.shortName).toBe("CSK");
      expect(teams.awayTeam.logoUrl).toBe("https://example.com/csk.png");

      // Away team playing players
      expect(teams.awayTeam.players.playingPlayers).toHaveLength(1);
      expect(teams.awayTeam.players.playingPlayers[0]).toEqual({
        id: "player-3",
        playerName: "ms_dhoni",
        role: "WICKET_KEEPER",
        photoUrl: "https://example.com/dhoni.png",
        displayName: "MS Dhoni",
      });

      // Away team bench players
      expect(teams.awayTeam.players.benchPlayers).toHaveLength(1);
      expect(teams.awayTeam.players.benchPlayers[0]).toEqual({
        id: "player-4",
        playerName: "tushar_deshpande",
        role: "BOWLER",
        photoUrl: null,
        displayName: "Tushar Deshpande",
      });

      expect(findUnique).toHaveBeenCalledOnce();
    });

    it("should return 404 for players of a non-existent match", async () => {
      findUnique.mockResolvedValueOnce(null);

      const response = await request(app).get(
        "/api/v1/matches/non-existent-id/players",
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });

  describe("GET /api/v1/matches/:id/score", () => {
    it("should return match score for a valid ID", async () => {
      const mockScoreData = {
        ...mockMatch,
        matchPlayers: [
          {
            teamId: "team-home-1",
            playerId: "player-1",
            isPlayingEleven: true,
            order: 1,
            battingOrder: 1,
            player: { id: "player-1", playerName: "rohit_sharma" },
          },
        ],
        balls: [
          {
            inningsNo: 1,
            strikerId: "player-1",
            bowlerId: "player-3",
            batterRuns: 4,
            wideRuns: 0,
            noBallRuns: 0,
            byeRuns: 0,
            legByeRuns: 0,
            penaltyRuns: 0,
            isWide: false,
            isNoBall: false,
            isBye: false,
            isLegBye: false,
            isPenalty: false,
            isDeadBall: false,
            boundaryType: "FOUR",
            isWicket: false,
          },
        ],
      };
      findUnique.mockResolvedValueOnce(mockScoreData);

      const response = await request(app).get("/api/v1/matches/match-1/score");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Score fetched successfully");
      expect(response.body.data.firstInning.score.run).toBe(180);
      expect(
        response.body.data.firstInning.playerBattingPerformance[0].runs,
      ).toBe(4);
      expect(
        response.body.data.firstInning.playerBattingPerformance[0].fours,
      ).toBe(1);
    });

    it("should return 404 for score of a non-existent match", async () => {
      findUnique.mockResolvedValueOnce(null);

      const response = await request(app).get(
        "/api/v1/matches/non-existent-id/score",
      );

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain("not found");
    });
  });
});

describe("404 Handler", () => {
  it("GET /invalid-route should return 404", async () => {
    const response = await request(app).get("/invalid-route");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "Route GET /invalid-route not found",
    );
  });

  it("GET /api/v1/unknown should return 404", async () => {
    const response = await request(app).get("/api/v1/unknown");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain("not found");
  });

  it("POST /api/v1/matches should return 404 for unsupported method", async () => {
    const response = await request(app).post("/api/v1/matches");

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain(
      "Route POST /api/v1/matches not found",
    );
  });
});
