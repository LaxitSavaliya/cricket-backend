export type organizationType = {
  id: string;
  userId: string;
  name: string;
  displayName: string | null;
  slug: string;
  logoUrl: string | null;
  city: string | null;
  state: string | null;
  isActive: boolean;
};

const organizations: organizationType[] = [
  {
    id: "org-1",
    userId: "user-1",
    name: "Cricket Association",
    displayName: "Cricket Hub",
    slug: "cricket-association",
    logoUrl: null,
    city: "Mumbai",
    state: "Maharashtra",
    isActive: true,
  },
];

export default organizations;
