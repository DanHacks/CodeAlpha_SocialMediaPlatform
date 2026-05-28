import "dotenv/config";
import http from "node:http";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { Server as IOServer } from "socket.io";

import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { authRouter } from "./routes/auth.js";
import { roomsRouter } from "./routes/rooms.js";
import { filesRouter } from "./routes/files.js";
import { errorHandler } from "./middleware/error.js";
import { registerSignaling } from "./signaling/index.js";

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(pinoHttp({ logger }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "safeguardmeet-api" }));

app.use("/api/auth", authRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/files", filesRouter);

app.use(errorHandler);

const io = new IOServer(server, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
});
registerSignaling(io);

server.listen(env.PORT, () => {
  logger.info(`SafeGuardMeet API listening on :${env.PORT}`);
});
