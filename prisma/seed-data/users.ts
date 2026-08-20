import players from "./players.js";

export type userType = {
  id: string;
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

const users: userType[] = players.map((player, i) => {
  const index = i + 1;
  const paddedIndex = String(index).padStart(2, "0");

  return {
    id: player.userId,
    googleId: `google_user_${paddedIndex}`,
    email: `${player.slug}@cricket.com`,
    name: player.name,
    avatarUrl: player.photoUrl,
  };
});

export default users;
