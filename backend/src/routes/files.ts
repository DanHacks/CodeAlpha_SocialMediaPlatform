import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";

export const filesRouter = Router();
filesRouter.use(requireAuth);

// Stub for S3-compatible signed URL flow.
filesRouter.post("/sign-upload", (req, res) => {
  const { roomId, filename, contentType } = z.object({
    roomId: z.string(),
    filename: z.string(),
    contentType: z.string(),
  }).parse(req.body);

  // TODO: integrate @aws-sdk/s3-request-presigner here.
  res.json({
    uploadUrl: `https://example-bucket/${roomId}/${filename}?signed=stub`,
    publicUrl: `https://cdn.safeguardmeet.app/${roomId}/${filename}`,
    contentType,
  });
});
