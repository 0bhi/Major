import { NextRequest, NextResponse } from "next/server";

const API = process.env.API_INTERNAL_URL ?? "http://localhost:4000";
const REFRESH_COOKIE = "refreshToken";

function cookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  };
}

export async function proxyToApi(request: NextRequest, backendPath: string) {
  const url = `${API}${backendPath}${request.nextUrl.search}`;
  const headers = new Headers();
  headers.set("content-type", request.headers.get("content-type") ?? "application/json");

  const auth = request.headers.get("authorization");
  if (auth) headers.set("authorization", auth);

  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (refresh) headers.set("cookie", `${REFRESH_COOKIE}=${refresh}`);

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";
  const body = hasBody ? await request.text() : undefined;

  const upstream = await fetch(url, {
    method,
    headers,
    body,
  });

  if (upstream.status === 204) {
    const res = new NextResponse(null, { status: 204 });
    if (backendPath.endsWith("/logout")) {
      res.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    }
    return res;
  }

  const text = await upstream.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    return new NextResponse(text, { status: upstream.status });
  }

  const isAuth =
    backendPath.startsWith("/api/auth/login") ||
    backendPath.startsWith("/api/auth/register") ||
    backendPath.startsWith("/api/auth/refresh");

  if (
    isAuth &&
    upstream.ok &&
    data &&
    typeof data === "object" &&
    "refreshToken" in data
  ) {
    const { refreshToken, ...rest } = data as {
      refreshToken: string;
      [k: string]: unknown;
    };
    const res = NextResponse.json(rest, { status: upstream.status });
    res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions());
    return res;
  }

  if (backendPath.endsWith("/logout")) {
    const res = NextResponse.json(data, { status: upstream.status });
    res.cookies.set(REFRESH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return res;
  }

  return NextResponse.json(data, { status: upstream.status });
}

export async function handleProxy(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const backendPath = `/api/${path.join("/")}`;
  return proxyToApi(request, backendPath);
}
