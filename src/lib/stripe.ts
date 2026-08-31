import Stripe from "stripe";

declare global {
  var __stripe: Stripe | undefined;
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY no está definida en .env");
  }
  globalThis.__stripe ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return globalThis.__stripe;
}