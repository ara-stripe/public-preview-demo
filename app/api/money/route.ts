import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const bankAccountsEnabled = searchParams.get("bankAccounts") === "true";
  const cardsEnabled = searchParams.get("cards") === "true";
  const prefillIdentity = searchParams.get("prefillIdentity") === "true";
  const country = searchParams.get("country") || "us";
  const useQA = searchParams.get("useQA") === "true";
  const accountLinkPrefix = searchParams.get("accountLinkPrefix") || "";

  // Determine which API key to use based on QA mode and country
  const getApiKey = () => {
    if (useQA) return process.env.STRIPE_QA_SECRET_KEY!;
    if (country === "gb") return process.env.STRIPE_UK_SECRET_KEY!;
    return process.env.STRIPE_SECRET_KEY!;
  };
  const apiKey = getApiKey();

  // Initialize Stripe with appropriate host
  const stripe = new Stripe(apiKey, {
    apiVersion: "2025-09-30.preview",
    host: useQA ? "qa-api.stripe.com" : "api.stripe.com",
  });

  // Build capabilities object
  const capabilities: Record<string, { requested: boolean } | { local: { requested: boolean }; wire: { requested: boolean } }> = {};
  if (bankAccountsEnabled) {
    capabilities.bank_accounts = {
      local: { requested: true },
      wire: { requested: false },
    };
  }
  if (cardsEnabled) {
    capabilities.cards = { requested: true };
  }

  // Build identity object - country is always required
  const identity = prefillIdentity
    ? {
        country: country,
        entity_type: "individual",
        individual: {
          phone: country === "gb" ? "+442071234567" : "+12345678900",
          email: "jenny.rosen@example.com",
          given_name: "Jenny",
          surname: "Rosen",
          date_of_birth: {
            day: 1,
            month: 1,
            year: 1990,
          },
          address: country === "gb" 
            ? {
                line1: "123 High Street",
                city: "London",
                postal_code: "SW1A 1AA",
                country: "GB",
              }
            : {
                line1: "12, 12th street",
                city: "san francisco",
                state: "CA",
                postal_code: "90210",
                country: "US",
              },
        },
      }
    : {
        country: country,
      };

  // Determine API base URL based on environment
  const apiBaseUrl = useQA ? "https://qa-api.stripe.com" : "https://api.stripe.com";

  // Create account using fetch since SDK doesn't support v2 accounts with cards
  const accountResponse = await fetch(`${apiBaseUrl}/v2/core/accounts`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
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

  // Transform URL if account link prefix is provided
  let finalUrl = accountLink.url;
  if (accountLinkPrefix && accountLinkPrefix.trim() !== "") {
    try {
      const urlObj = new URL(accountLink.url);
      // Replace domain with prefix pattern
      urlObj.hostname = `${accountLinkPrefix}--recipient_payouts_hosted_onboarding-mydev.dev.stripe.me`;
      finalUrl = urlObj.toString();
    } catch (error) {
      console.error("Error transforming URL:", error);
      // If URL transformation fails, use original URL
    }
  }

  return NextResponse.json({
    url: finalUrl,
    accountId: account.id,
  });
}
