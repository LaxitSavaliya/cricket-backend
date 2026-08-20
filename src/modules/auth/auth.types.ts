import type { Request } from "express";

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface GoogleLoginResult {
  userId: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: GoogleLoginResult;
  authUser?: AuthUser;
}
