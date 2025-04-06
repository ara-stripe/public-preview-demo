import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.preview",
});

export async function POST(req: Request) {
  const { accountId } = await req.json();
  // todo dynamically fetch financial account id
  try {
    const payout = await stripe.v2.moneyManagement.outboundPayments.create({
      from: {
        financial_account:
          "fa_test_65SK3CdqS8HxZTEo7wH16SJgIp1YSQPFiuViibrTEXY7w8",
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
