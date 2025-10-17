import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-09-30.preview",
  });

  const { accountId } = await req.json();
  // todo dynamically fetch financial account id
  const financialAccounts =
    await stripe.v2.moneyManagement.financialAccounts.list();
  const financialAccountId = financialAccounts.data[0].id;
  try {
    const payout = await stripe.v2.moneyManagement.outboundPayments.create({
      from: {
        financial_account: financialAccountId,
        currency: "usd",
      },
      to: {
        recipient: accountId,
        currency: "usd",
      },
      amount: {
        value: 100,
        currency: "usd",
      },
      description: "ara public preview demo earings",
    });

    return NextResponse.json({ success: true, paymentId: payout.id });
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Payment failed" }, { status: 400 });
  }
}
