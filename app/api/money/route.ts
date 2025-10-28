import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-09-30.preview",
  });

  // Create account using fetch since SDK doesn't support v2 accounts with cards
  const accountResponse = await fetch("https://api.stripe.com/v2/core/accounts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/json",
      "Stripe-Version": "2025-09-30.preview",
    },
    body: JSON.stringify({
      contact_email: "jenny.rosen@example.com",
      display_name: "Ara demo app PUB PREVIEW",
      identity: {
        country: "us",
        entity_type: "individual",
        individual: {
          phone: "+12345678900",
          email: "jenny.rosen@example.com",
          given_name: "Jenny",
          surname: "Rosen",
          address: {
            line1: "12, 12th street",
            city: "san francisco",
            state: "CA",
            postal_code: "90210",
            country: "US",
          },
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            cards: {
              requested: true,
            },
          },
        },
      },
      include: ["configuration.recipient", "identity", "requirements"],
    }),
  });

  if (!accountResponse.ok) {
    const error = await accountResponse.text();
    console.error("Account creation error:", error);
    return NextResponse.json(
      { error: "Account creation failed" },
      { status: accountResponse.status }
    );
  }

  const account = await accountResponse.json();
  console.log("Account created:", JSON.stringify(account, null, 2));
  const accountLink = await stripe.v2.core.accountLinks.create({
    account: account.id,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["recipient"],
        return_url: "https://example.com/return",
        refresh_url: "https://example.com/reauth",
      },
    },
  });
  return NextResponse.json({
    url: accountLink.url,
    accountId: account.id,
  });
}
