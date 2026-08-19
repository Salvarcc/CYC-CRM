import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const cpus = await prisma.cpu.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(cpus);
}

export async function POST(request: Request) {
  const body = await request.json();
  const cpu = await prisma.cpu.create({ data: body });
  return NextResponse.json(cpu, { status: 201 });
}
