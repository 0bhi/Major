import { NextRequest } from "next/server";
import { handleProxy } from "@/lib/proxy";

type Ctx = { params: Promise<{ path: string[] }> };

export function GET(request: NextRequest, ctx: Ctx) {
  return handleProxy(request, ctx);
}
export function POST(request: NextRequest, ctx: Ctx) {
  return handleProxy(request, ctx);
}
export function PUT(request: NextRequest, ctx: Ctx) {
  return handleProxy(request, ctx);
}
export function PATCH(request: NextRequest, ctx: Ctx) {
  return handleProxy(request, ctx);
}
export function DELETE(request: NextRequest, ctx: Ctx) {
  return handleProxy(request, ctx);
}
