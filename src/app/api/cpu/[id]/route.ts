import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const cpu = await prisma.cpu.findUnique({ where: { id } });
  if (!cpu) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(cpu);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const cpu = await prisma.cpu.update({ where: { id }, data: body });
  return NextResponse.json(cpu);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.cpu.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
