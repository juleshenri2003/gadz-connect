import "dotenv/config";
import cors from "cors";
import express, { type RequestHandler } from "express";
import helmetPkg from "helmet";
import { errorHandler } from "./middleware/error-handler.js";
import { createRateLimiter } from "./middleware/rate-limit.js";
import { publicTutorsRouter } from "./routes/public/tutors.js";
import { adminRouter } from "./routes/admin.js";
import { authRouter } from "./routes/auth.js";
import { campusRouter } from "./routes/campus.js";
import { fiscalRouter } from "./routes/fiscal.js";
import { onboardingDocsRouter } from "./routes/onboarding-docs.js";
import { profileRouter } from "./routes/profile.js";
import { studentLearningProfileRouter } from "./routes/student-learning-profile.js";
import { healthRouter } from "./routes/health.js";
import { stripeRouter } from "./routes/stripe.js";
import { notificationsRouter } from "./routes/notifications.js";
import { coursesRouter } from "./routes/courses.js";
import { replacementRouter } from "./routes/replacement.js";
import { repositoryRouter } from "./routes/repository.js";
import { scheduleRouter } from "./routes/schedule.js";
import { studentsRouter } from "./routes/students.js";
import { tutorsRouter } from "./routes/tutors.js";
import { evaluationsRouter } from "./routes/evaluations.js";
import { stripeWebhookRouter } from "./routes/webhooks/stripe.js";

const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";

const app = express();

app.use((helmetPkg as unknown as () => RequestHandler)());

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
app.use((req, res, next) => {
  const limit = req.path.startsWith("/api/evaluations") ? "8mb" : "1mb";
  express.json({ limit })(req, res, next);
});

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/campus", campusRouter);
app.use(
  "/api/public",
  createRateLimiter({ keyPrefix: "public", maxRequests: 60, windowMs: 60_000 }),
  publicTutorsRouter,
);
app.use("/api/profile", profileRouter);
app.use("/api/profile", studentLearningProfileRouter);
app.use("/api/onboarding/documents", onboardingDocsRouter);
app.use("/api/fiscal", fiscalRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/replacement", replacementRouter);
app.use("/api/repository", repositoryRouter);
app.use("/api/tutors", tutorsRouter);
app.use("/api/students", studentsRouter);
app.use("/api/evaluations", evaluationsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/stripe", stripeRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use(errorHandler);

export default app;
