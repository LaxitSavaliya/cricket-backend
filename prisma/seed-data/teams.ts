type teamTypes = {
  id: string;
  tournamentId: string;
  teamName: string;
  logoUrl: string | null;
  slug: string;
};

const teams: teamTypes[] = [
  {
    id: "101",
    tournamentId: "tour-1",
    teamName: "India",
    logoUrl: null,
    slug: "india",
  },
  {
    id: "102",
    tournamentId: "tour-1",
    teamName: "England",
    logoUrl: null,
    slug: "england",
  },
  {
    id: "103",
    tournamentId: "tour-1",
    teamName: "Australia",
    logoUrl: null,
    slug: "australia",
  },
  {
    id: "104",
    tournamentId: "tour-1",
    teamName: "New Zealand",
    logoUrl: null,
    slug: "new-zealand",
  },
  {
    id: "105",
    tournamentId: "tour-1",
    teamName: "Sri Lanka",
    logoUrl: null,
    slug: "sri-lanka",
  },
  {
    id: "106",
    tournamentId: "tour-1",
    teamName: "South Africa",
    logoUrl: null,
    slug: "south-africa",
  },
  {
    id: "107",
    tournamentId: "tour-1",
    teamName: "West Indies",
    logoUrl: null,
    slug: "west-indies",
  },
  {
    id: "108",
    tournamentId: "tour-1",
    teamName: "Ireland",
    logoUrl: null,
    slug: "ireland",
  },
];

export default teams;
