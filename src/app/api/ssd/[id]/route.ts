import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ssd = await prisma.ssd.findUnique({ where: { id } });
  if (!ssd) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(ssd);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json();
  const ssd = await prisma.ssd.update({ where: { id }, data: body });
  return NextResponse.json(ssd);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await prisma.ssd.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
