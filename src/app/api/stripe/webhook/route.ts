import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { decrementStocks, generateVentaNumero } from "@/lib/ventas";

export const runtime = "nodejs";

type InvoiceMeta = Record<string, string>;

function txModelMap(tx: Prisma.TransactionClient) {
  return {
    cpu: tx.cpu,
    motherboard: tx.motherboard,
    ram: tx.ram,
    gpu: tx.gpu,
    cooler: tx.cooler,
    case: tx.case,
    psu: tx.psu,
    ssd: tx.ssd,
    monitor: tx.monitor,
  } as unknown as Parameters<typeof decrementStocks>[1];
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  const stripe = getStripe();

  // Idempotencia: un mismo session_id solo genera una venta.
  const existing = await prisma.venta.findUnique({
    where: { stripeSessionId: session.id },
  });
  if (existing) return;

  if (session.payment_status !== "paid") return;

  const clientId = session.metadata?.clienteId;
  const cliente = clientId
    ? await prisma.cliente.findUnique({ where: { id: clientId } })
    : null;
  if (!cliente) return; // cuenta eliminada: no inventariar la venta

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
  });

  const items: {
    productId: string;
    stepKey: string;
    nombre: string;
    marca: string;
    precioUsd: Prisma.Decimal;
    imagenUrl: string | null;
    qty: number;
  }[] = [];

  for (const li of lineItems.data) {
    const price = li.price;
    const product =
      price?.product &&
      typeof price.product === "object" &&
      "name" in price.product
        ? (price.product as Stripe.Product)
        : null;
    const meta = (product?.metadata ?? {}) as InvoiceMeta;
    if (meta.igv === "true") continue; // línea informativa de IGV

    items.push({
      productId: meta.productId ?? "",
      stepKey: meta.categoryKey ?? "",
      nombre: product?.name ?? li.description ?? "Producto",
      marca: meta.marca ?? "",
      precioUsd: new Prisma.Decimal((price?.unit_amount ?? 0) / 100),
      imagenUrl: product?.images?.[0] ?? null,
      qty: li.quantity ?? 1,
    });
  }

  if (items.length === 0) return;

  const subtotalCents = Number(session.metadata?.subtotalCents ?? "0");
  const igvCents = Number(session.metadata?.igvCents ?? "0");
  const totalCents = Number(session.metadata?.totalCents ?? "0");
  const numero = await generateVentaNumero();

  await prisma.$transaction(async (tx) => {
    await tx.venta.create({
      data: {
        numero,
        clienteId: cliente.id,
        stripeSessionId: session.id,
        subtotalUsd: new Prisma.Decimal(subtotalCents / 100),
        igvUsd: new Prisma.Decimal(igvCents / 100),
        totalUsd: new Prisma.Decimal(totalCents / 100),
        moneda: "USD",
        estado: "Pagada",
        items: { create: items },
      },
    });
    await decrementStocks(
      items.map((i) => ({ categoryKey: i.stepKey, productId: i.productId, qty: i.qty })),
      txModelMap(tx),
    );
  });
}

/* ------------------------------------------------------------------ */
/*  POST — Evento de Stripe                                            */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret.startsWith("whsec_placeholder")) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET no configurado. Ejecuta: stripe listen --forward-to localhost:3000/api/stripe/webhook" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Falta firma de Stripe." }, { status: 400 });
  }

  const payload = await request.text();

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Firma inválida: ${err instanceof Error ? err.message : "desconocido"}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    try {
      await handleCheckoutSession(session);
    } catch (err) {
      console.error("[stripe-webhook] Error al crear venta", err);
      return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}