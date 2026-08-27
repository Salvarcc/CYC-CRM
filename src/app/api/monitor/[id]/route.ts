import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const monitor = await prisma.monitor.findUnique({ where: { id } });
  if (!monitor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(monitor);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const monitor = await prisma.monitor.update({ where: { id }, data: body });
  return NextResponse.json(monitor);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.monitor.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
