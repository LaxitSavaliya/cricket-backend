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

  if (player.userId === "user-1") {
    return {
      id: player.userId,
      googleId: "104164120012759890751",
      email: "laxit.istosyinfotech@gmail.com",
      name: "la Istosy",
      avatarUrl:
        "https://lh3.googleusercontent.com/a/ACg8ocIMRBRsZAfcwiUOVS4e19ThO-Wod-oGZ4rSQmNTItouEWJz0g=s96-c",
    };
  }

  return {
    id: player.userId,
    googleId: `google_user_${paddedIndex}`,
    email: `${player.slug}@cricket.com`,
    name: player.name,
    avatarUrl: player.photoUrl,
  };
});

export default users;
