import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function GET() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-09-30.preview",
  });

  const account = await stripe.v2.core.accounts.create({
    contact_email: "jenny.rosen@example.com",
    display_name: "Ara demo app PUB PREVIEW",
    identity: {
      country: "us",
      entity_type: "individual",
    },
    configuration: {
      recipient: {
        capabilities: {
          bank_accounts: {
            local: {
              requested: true,
            },
          },
        },
      },
    },
    include: ["identity", "configuration.recipient", "requirements"],
  });

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
