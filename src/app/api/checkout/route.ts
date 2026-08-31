import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";
import {
  buildCheckoutLines,
  buildTotals,
  productMeta,
  type CheckoutItemInput,
} from "@/lib/ventas";

/* ------------------------------------------------------------------ */
/*  POST — Crear sesión de Stripe Checkout a partir del carrito        */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Debes iniciar sesión para realizar el pago." },
      { status: 401 },
    );
  }

  let body: { items?: CheckoutItemInput[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "Tu carrito está vacío." }, { status: 400 });
  }

  let lines;
  try {
    lines = await buildCheckoutLines(items);
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo validar el carrito.";
    return NextResponse.json(
      { error: message, code: "stock" },
      { status: 400 },
    );
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: "Tu carrito está vacío." }, { status: 400 });
  }

  const cliente = await prisma.cliente.findUnique({
    where: { id: session.user.id },
    select: { id: true, correo: true },
  });
  if (!cliente) {
    return NextResponse.json({ error: "Cuenta de cliente no encontrada." }, { status: 401 });
  }

  const totals = buildTotals(lines);

  const stripe = getStripe();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: cliente.correo,
    line_items: [
      ...lines.map((line) => ({
        price_data: {
          currency: "usd",
          unit_amount: line.unitAmountCents,
          product_data: {
            name: line.nombre,
            images: line.imagenUrl ? [line.imagenUrl] : undefined,
            metadata: productMeta(line),
          },
        },
        quantity: line.qty,
      })),
      {
        price_data: {
          currency: "usd",
          unit_amount: totals.igvCents,
          product_data: {
            name: "IGV (18%)",
            metadata: { igv: "true" },
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      clienteId: cliente.id,
      subtotalCents: String(totals.subtotalCents),
      igvCents: String(totals.igvCents),
      totalCents: String(totals.totalCents),
    },
    success_url: `${new URL(request.url).origin}/carrito/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${new URL(request.url).origin}/carrito?cancelado=1`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}