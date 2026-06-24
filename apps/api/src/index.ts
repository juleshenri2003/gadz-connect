import app from "./app.js";

const PORT = Number(process.env.PORT ?? 3001);

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`[gadz-connect-api] listening on http://localhost:${PORT}`);
  });
}

export default app;
