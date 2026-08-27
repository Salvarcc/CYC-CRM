import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ssds = await prisma.ssd.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(ssds);
}

export async function POST(request: Request) {
  const body = await request.json();
  const ssd = await prisma.ssd.create({ data: body });
  return NextResponse.json(ssd, { status: 201 });
}
