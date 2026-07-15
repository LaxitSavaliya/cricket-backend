import { prisma } from "../../config/prisma.js";

import {
  matchDetailsBySlugSelect,
  matchListSelect,
  matchPlayersBySlugSelect,
  type CompletedMatchResult,
  type MatchDetailsBySlug,
  type MatchDetailsBySlugQueryResult,
  type MatchInningSummary,
  type MatchListItem,
  type MatchListQueryResult,
  type MatchPlayerItem,
  type MatchPlayerQueryResult,
  type MatchPlayersBySlugQueryResult,
  type MatchPlayersResponse,
  type MatchPlayersTeam,
  type MatchTeamDetails,
  type MatchTeamQueryResult,
  type MatchTeamSummary,
} from "./match.types.js";

const normalizeSlug = (slug: string): string => {
  return slug.trim();
};

const generateTeamShortName = (teamName: string): string => {
  const normalizedTeamName = teamName.trim();

  if (normalizedTeamName.length === 0) {
    return "";
  }

  const words = normalizedTeamName.split(/\s+/);

  if (words.length === 1) {
    return normalizedTeamName.slice(0, 3).toUpperCase();
  }

  return words
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
};

const formatMatchTeamDetails = (
  team: MatchTeamQueryResult,
): MatchTeamDetails => {
  return {
    id: team.id,
    teamName: team.teamName,
    shortName: generateTeamShortName(team.teamName),
    slug: team.slug,
    logoUrl: team.logoUrl,
  };
};

const formatMatchTeamSummary = (
  team: MatchTeamQueryResult,
  inning: MatchInningSummary | undefined,
): MatchTeamSummary => {
  return {
    ...formatMatchTeamDetails(team),
    inningsNo: inning?.inningsNo ?? null,
    runs: inning?.runs ?? 0,
    wickets: inning?.wickets ?? 0,
    balls: inning?.balls ?? 0,
  };
};

const MAX_WICKETS_PER_INNINGS = 10;

const pluralize = (
  amount: number,
  singular: string,
  plural: string,
): string => {
  return amount === 1 ? singular : plural;
};

const getInningsTeams = (
  homeTeam: MatchTeamSummary,
  awayTeam: MatchTeamSummary,
): {
  firstInningsTeam: MatchTeamSummary;
  secondInningsTeam: MatchTeamSummary;
} | null => {
  if (homeTeam.inningsNo === "FIRST" && awayTeam.inningsNo === "SECOND") {
    return {
      firstInningsTeam: homeTeam,
      secondInningsTeam: awayTeam,
    };
  }

  if (awayTeam.inningsNo === "FIRST" && homeTeam.inningsNo === "SECOND") {
    return {
      firstInningsTeam: awayTeam,
      secondInningsTeam: homeTeam,
    };
  }

  return null;
};

const generateCompletedMatchResult = (
  status: MatchListQueryResult["status"],
  homeTeam: MatchTeamSummary,
  awayTeam: MatchTeamSummary,
): CompletedMatchResult | null => {
  if (status !== "COMPLETED") {
    return null;
  }

  const inningsTeams = getInningsTeams(homeTeam, awayTeam);

  if (!inningsTeams) {
    return null;
  }

  const { firstInningsTeam, secondInningsTeam } = inningsTeams;

  if (firstInningsTeam.runs === secondInningsTeam.runs) {
    return {
      type: "TIED",
      winnerTeamId: null,
      margin: null,
      text: "Match tied",
    };
  }

  if (secondInningsTeam.runs > firstInningsTeam.runs) {
    const wicketsRemaining =
      MAX_WICKETS_PER_INNINGS - secondInningsTeam.wickets;

    if (wicketsRemaining <= 0) {
      return null;
    }

    return {
      type: "WICKETS",
      winnerTeamId: secondInningsTeam.id,
      margin: wicketsRemaining,
      text: `${secondInningsTeam.teamName} won by ${wicketsRemaining} ${pluralize(
        wicketsRemaining,
        "wicket",
        "wickets",
      )}`,
    };
  }

  const winningMargin = firstInningsTeam.runs - secondInningsTeam.runs;

  return {
    type: "RUNS",
    winnerTeamId: firstInningsTeam.id,
    margin: winningMargin,
    text: `${firstInningsTeam.teamName} won by ${winningMargin} ${pluralize(
      winningMargin,
      "run",
      "runs",
    )}`,
  };
};

const formatMatchListItem = (match: MatchListQueryResult): MatchListItem => {
  const homeTeamInning = match.innings.find(
    (inning) => inning.teamId === match.homeTeamId,
  );

  const awayTeamInning = match.innings.find(
    (inning) => inning.teamId === match.awayTeamId,
  );

  const homeTeam = formatMatchTeamSummary(match.homeTeam, homeTeamInning);

  const awayTeam = formatMatchTeamSummary(match.awayTeam, awayTeamInning);

  return {
    id: match.id,
    title: match.title,
    slug: match.slug,
    matchFormat: match.matchFormat,
    status: match.status,
    matchDate: match.matchDate,
    tossWinnerTeamId: match.tossWinnerTeamId,
    tossDecision: match.tossDecision,

    homeTeam,
    awayTeam,

    result: generateCompletedMatchResult(match.status, homeTeam, awayTeam),
  };
};

const formatMatchDetails = (
  match: MatchDetailsBySlugQueryResult,
): MatchDetailsBySlug => {
  return {
    id: match.id,
    title: match.title,
    slug: match.slug,
    matchFormat: match.matchFormat,
    status: match.status,
    matchDate: match.matchDate,
    venue: match.venue,
    city: match.city,
    tossWinnerTeamId: match.tossWinnerTeamId,
    tossDecision: match.tossDecision,

    homeTeam: formatMatchTeamDetails(match.homeTeam),
    awayTeam: formatMatchTeamDetails(match.awayTeam),
  };
};

const resolvePlayerDisplayName = (
  playerName: string,
  displayName: string | null,
): string => {
  const normalizedDisplayName = displayName?.trim();

  return normalizedDisplayName || playerName;
};

const formatMatchPlayer = (
  matchPlayer: MatchPlayerQueryResult,
): MatchPlayerItem => {
  const { player } = matchPlayer;

  return {
    id: player.id,
    playerName: player.playerName,
    displayName: resolvePlayerDisplayName(
      player.playerName,
      player.displayName,
    ),
    role: player.role,
    photoUrl: player.photoUrl,
    isCaptain: matchPlayer.isCaptain,
    isViceCaptain: matchPlayer.isViceCaptain,
  };
};

const formatMatchPlayersTeam = (
  team: MatchTeamQueryResult,
  matchPlayers: MatchPlayerQueryResult[],
): MatchPlayersTeam => {
  const teamMatchPlayers = matchPlayers.filter(
    (matchPlayer) => matchPlayer.teamId === team.id,
  );

  const players: MatchPlayerItem[] = [];
  const benchPlayers: MatchPlayerItem[] = [];

  for (const matchPlayer of teamMatchPlayers) {
    const formattedPlayer = formatMatchPlayer(matchPlayer);

    if (matchPlayer.isPlaying) {
      players.push(formattedPlayer);
    } else {
      benchPlayers.push(formattedPlayer);
    }
  }

  return {
    ...formatMatchTeamDetails(team),
    players,
    benchPlayers,
  };
};

const formatMatchPlayersResponse = (
  match: MatchPlayersBySlugQueryResult,
): MatchPlayersResponse => {
  return {
    homeTeam: formatMatchPlayersTeam(match.homeTeam, match.players),

    awayTeam: formatMatchPlayersTeam(match.awayTeam, match.players),
  };
};

export const getAllMatches = async (): Promise<MatchListItem[]> => {
  const matches = await prisma.match.findMany({
    select: matchListSelect,

    orderBy: {
      matchDate: "desc",
    },
  });

  return matches.map(formatMatchListItem);
};

export const getMatchBySlug = async (
  slug: string,
): Promise<MatchDetailsBySlug | null> => {
  const normalizedSlug = normalizeSlug(slug);

  if (normalizedSlug.length === 0) {
    return null;
  }

  const match = await prisma.match.findUnique({
    where: {
      slug: normalizedSlug,
    },

    select: matchDetailsBySlugSelect,
  });

  return match ? formatMatchDetails(match) : null;
};

export const getMatchPlayersBySlug = async (
  slug: string,
): Promise<MatchPlayersResponse | null> => {
  const normalizedSlug = normalizeSlug(slug);

  if (normalizedSlug.length === 0) {
    return null;
  }

  const match = await prisma.match.findUnique({
    where: {
      slug: normalizedSlug,
    },

    select: matchPlayersBySlugSelect,
  });

  return match ? formatMatchPlayersResponse(match) : null;
};
