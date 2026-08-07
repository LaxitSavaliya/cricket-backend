import players from "./players.js";

export type userType = {
  id: string;
  email: string | null;
  mobile: string | null;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
};

const users: userType[] = players.map((player, i) => {
  const index = i + 1;
  const paddedIndex = String(index).padStart(2, "0");

  const pattern = i % 4;

  let email: string | null = `${player.slug}@cricket.com`;
  let mobile: string | null = `+9198765432${paddedIndex}`;
  let isEmailVerified = false;
  let isMobileVerified = false;

  switch (pattern) {
    case 0:
      // Both email and mobile present & verified
      isEmailVerified = true;
      isMobileVerified = true;
      break;

    case 1:
      // Only email present & verified (mobile is null)
      mobile = null;
      isEmailVerified = true;
      isMobileVerified = false;
      break;

    case 2:
      // Only mobile present & verified (email is null)
      email = null;
      isEmailVerified = false;
      isMobileVerified = true;
      break;

    case 3:
      // Both email and mobile present, but neither verified
      isEmailVerified = false;
      isMobileVerified = false;
      break;
  }

  return {
    id: player.userId,
    email,
    mobile,
    isEmailVerified,
    isMobileVerified,
  };
});

export default users;
