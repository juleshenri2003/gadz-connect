import { Router } from "express";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "gadz-connect-api",
    timestamp: new Date().toISOString(),
  });
});
