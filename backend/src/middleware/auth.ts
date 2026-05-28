import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HttpError } from "./error.js";

export interface AuthUser {
  sub: string;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw new HttpError(401, "missing_token");
  try {
    const payload = jwt.verify(header.slice(7), env.JWT_ACCESS_SECRET) as AuthUser;
    req.user = payload;
    next();
  } catch {
    throw new HttpError(401, "invalid_token");
  }
};
