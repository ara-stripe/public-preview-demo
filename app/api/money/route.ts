import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-09-30.preview",
  });

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const bankAccountsEnabled = searchParams.get("bankAccounts") === "true";
  const cardsEnabled = searchParams.get("cards") === "true";
  const prefillIdentity = searchParams.get("prefillIdentity") === "true";

  // Build capabilities object
  const capabilities: Record<string, { requested: boolean }> = {};
  if (bankAccountsEnabled) {
    capabilities.bank_accounts = { requested: true };
  }
  if (cardsEnabled) {
    capabilities.cards = { requested: true };
  }

  // Build identity object - country is always required
  const identity = prefillIdentity
    ? {
        country: "us",
        entity_type: "individual",
        individual: {
          phone: "+12345678900",
          email: "jenny.rosen@example.com",
          given_name: "Jenny",
          surname: "Rosen",
          date_of_birth: {
            day: 1,
            month: 1,
            year: 1990,
          },
          address: {
            line1: "12, 12th street",
            city: "san francisco",
            state: "CA",
            postal_code: "90210",
            country: "US",
          },
        },
      }
    : {
        country: "us",
      };

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
      identity,
      configuration: {
        recipient: {
          capabilities,
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
