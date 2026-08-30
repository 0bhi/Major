import { createHash } from "node:crypto";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const ACCESS_EXPIRES = "15m";
const REFRESH_EXPIRES_SEC = 7 * 24 * 60 * 60;

function accessSecret() {
  const s = process.env.JWT_ACCESS_SECRET;
  if (!s) throw new Error("JWT_ACCESS_SECRET is not set");
  return s;
}

function refreshSecret() {
  const s = process.env.JWT_REFRESH_SECRET;
  if (!s) throw new Error("JWT_REFRESH_SECRET is not set");
  return s;
}

export type AccessPayload = {
  sub: string;
  email: string;
  name: string;
  type: "access";
};

export type RefreshPayload = {
  sub: string;
  type: "refresh";
};

export function signAccessToken(user: { id: string; email: string; name: string }) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name, type: "access" } satisfies AccessPayload,
    accessSecret(),
    { expiresIn: ACCESS_EXPIRES },
  );
}

export function signRefreshToken(userId: string) {
  return jwt.sign(
    { sub: userId, type: "refresh" } satisfies RefreshPayload,
    refreshSecret(),
    { expiresIn: REFRESH_EXPIRES_SEC },
  );
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshExpiryDate() {
  return new Date(Date.now() + REFRESH_EXPIRES_SEC * 1000);
}

export function verifyAccessToken(token: string): AccessPayload {
  const payload = jwt.verify(token, accessSecret()) as AccessPayload;
  if (payload.type !== "access") throw new Error("Invalid token type");
  return payload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const payload = jwt.verify(token, refreshSecret()) as RefreshPayload;
  if (payload.type !== "refresh") throw new Error("Invalid token type");
  return payload;
}

export type AuthedRequest = Request & {
  user: { id: string; email: string; name: string };
};

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    (req as AuthedRequest).user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
    };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

export function getRefreshTokenFromRequest(req: Request): string | null {
  const fromCookie = req.cookies?.refreshToken as string | undefined;
  if (fromCookie) return fromCookie;
  const body = req.body as { refreshToken?: string } | undefined;
  if (body?.refreshToken) return body.refreshToken;
  return null;
}
