import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { signAccess, signRefresh, verifyRefresh } from "../services/tokens.js";
import { HttpError } from "../middleware/error.js";

export const authRouter = Router();

// In-memory user store. Swap with Postgres in production.
interface UserRow { id: string; email: string; name: string; passwordHash: string }
const users = new Map<string, UserRow>();

const credentials = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

authRouter.post("/register", async (req, res) => {
  const { email, password, name } = credentials.parse(req.body);
  if (users.has(email)) throw new HttpError(409, "email_taken");
  const passwordHash = await bcrypt.hash(password, 12);
  const user: UserRow = { id: crypto.randomUUID(), email, name: name ?? email, passwordHash };
  users.set(email, user);
  res.status(201).json({ id: user.id, email: user.email });
});

authRouter.post("/login", async (req, res) => {
  const { email, password } = credentials.parse(req.body);
  const user = users.get(email);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new HttpError(401, "invalid_credentials");
  }
  const payload = { sub: user.id, email: user.email };
  res.json({
    user: { id: user.id, email: user.email, name: user.name },
    accessToken: signAccess(payload),
    refreshToken: signRefresh(payload),
  });
});

authRouter.post("/refresh", (req, res) => {
  const { refreshToken } = z.object({ refreshToken: z.string() }).parse(req.body);
  const decoded = verifyRefresh<{ sub: string; email: string }>(refreshToken);
  res.json({ accessToken: signAccess({ sub: decoded.sub, email: decoded.email }) });
});
