type teamTypes = {
  id: string;
  teamName: string;
  logoUrl: string | null;
  slug: string;
};

const teams: teamTypes[] = [
  {
    id: "101",
    teamName: "India",
    logoUrl: null,
    slug: "india",
  },
  {
    id: "102",
    teamName: "England",
    logoUrl: null,
    slug: "england",
  },
];

export default teams;
