import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const monitors = await prisma.monitor.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(monitors);
}

export async function POST(request: Request) {
  const body = await request.json();
  const monitor = await prisma.monitor.create({ data: body });
  return NextResponse.json(monitor, { status: 201 });
}
