import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { errorHandler } from "./middleware/error-handler.js";
import { fiscalRouter } from "./routes/fiscal.js";
import { healthRouter } from "./routes/health.js";
import { stripeRouter } from "./routes/stripe.js";
import { stripeWebhookRouter } from "./routes/webhooks/stripe.js";

const PORT = Number(process.env.PORT ?? 3001);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const app = express();

app.use(helmet());

// Webhook Stripe : corps brut obligatoire (avant express.json)
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookRouter,
);

app.use(
  cors({
    origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  }),
);
app.use(express.json({ limit: "1mb" }));

app.use("/health", healthRouter);
app.use("/api/fiscal", fiscalRouter);
app.use("/api/stripe", stripeRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[gadz-connect-api] listening on http://localhost:${PORT}`);
});
