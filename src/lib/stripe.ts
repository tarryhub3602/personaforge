import Stripe from "stripe";

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error(
      "STRIPE_SECRET_KEY manquante. Ajoutez-la dans .env.local",
    );
  }

  return new Stripe(secretKey);
}
