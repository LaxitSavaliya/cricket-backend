import type { Request } from "express";

import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";

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

export enum AUTH_PORTAL {
  PLAYER = "player",
  ORGANIZATION = "organization",
}

export interface GoogleLoginResult {
  userId: string;
  portal: AUTH_PORTAL;
}

export interface AuthenticatedRequest<
  P = ParamsDictionary,
  ResBody = unknown,
  ReqBody = unknown,
  ReqQuery = ParsedQs,
> extends Request<P, ResBody, ReqBody, ReqQuery> {
  auth?: GoogleLoginResult;
  authUser?: AuthUser;
}
