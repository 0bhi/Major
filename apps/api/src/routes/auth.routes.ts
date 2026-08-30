import { Router } from "express";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { loginSchema, registerSchema } from "../lib/schemas.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  getRefreshTokenFromRequest,
  hashToken,
  refreshExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../middleware/auth.middleware.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), async (req, res) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  const tokens = await issueTokens(user.id, user.email, user.name);
  res.status(201).json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

authRouter.post("/login", validateBody(loginSchema), async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const tokens = await issueTokens(user.id, user.email, user.name);
  res.json({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

authRouter.post("/refresh", async (req, res) => {
  const raw = getRefreshTokenFromRequest(req);
  if (!raw) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const payload = verifyRefreshToken(raw);
    const tokenHash = hashToken(raw);
    const stored = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });
    if (!stored || stored.userId !== payload.sub || stored.expiresAt < new Date()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });
    const tokens = await issueTokens(
      stored.user.id,
      stored.user.email,
      stored.user.name,
    );
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: stored.user.id,
        name: stored.user.name,
        email: stored.user.email,
      },
    });
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
});

authRouter.post("/logout", async (req, res) => {
  const raw = getRefreshTokenFromRequest(req);
  if (raw) {
    const tokenHash = hashToken(raw);
    await prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }
  res.json({ ok: true });
});

async function issueTokens(userId: string, email: string, name: string) {
  const accessToken = signAccessToken({ id: userId, email, name });
  const refreshToken = signRefreshToken(userId);
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiryDate(),
    },
  });
  return { accessToken, refreshToken };
}
