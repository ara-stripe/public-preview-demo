import { NextResponse } from "next/server";
import { onboardedAccounts } from "../../lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { accountId } = body;

  if (!accountId) {
    return NextResponse.json({ error: "Account ID required" }, { status: 400 });
  }

  const isOnboarded = !!onboardedAccounts[accountId];
  return NextResponse.json({ isOnboarded });
}
