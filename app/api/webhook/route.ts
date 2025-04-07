import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { onboardedAccounts } from "../../lib/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.preview",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  try {
    const event = stripe.parseThinEvent(body, signature, webhookSecret);

    console.log("Received event:", event);
    if (event.type === "v2.core.account_link.completed") {
      const fullEvent = await stripe.v2.core.events.retrieve(event.id);
      // @ts-expect-error: v2 events are not typed
      const data = fullEvent.data;
      const accountId = data.account_id;

      // Store the account ID
      onboardedAccounts[accountId] = true;
      console.log("Added account to database:", accountId);
      console.log("Current onboarded accounts:", onboardedAccounts);
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}
