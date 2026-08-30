import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { expensesRouter } from "./routes/expenses.routes.js";
import { incomeRouter } from "./routes/income.routes.js";
import { loansRouter } from "./routes/loans.routes.js";

const app = express();
const port = Number(process.env.PORT ?? 4000);

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/income", incomeRouter);
app.use("/api/expenses", expensesRouter);
app.use("/api/loans", loansRouter);
app.use("/api/analytics", analyticsRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status =
    typeof err === "object" && err && "status" in err && typeof err.status === "number"
      ? err.status
      : typeof err === "object" && err && "statusCode" in err && typeof err.statusCode === "number"
        ? err.statusCode
        : 500;
  if (status >= 500) console.error(err);
  const message =
    status === 400 && typeof err === "object" && err && "type" in err
      ? "Invalid JSON body"
      : "Internal server error";
  res.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`FINPILOT API listening on http://localhost:${port}`);
});
