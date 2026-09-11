import { NextResponse } from "next/server";
import { getToken, getDbPrizes } from "@/lib/db";
import { verifySignedToken } from "@/lib/tokens";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenCode = searchParams.get("token");

  const prizes = await getDbPrizes();

  if (!tokenCode) {
    return NextResponse.json({
      valid: false,
      prizes,
      error: "No token provided in request.",
    });
  }

  // 1. First check if it's a signed token (Vercel Serverless Compatible)
  const signedPayload = verifySignedToken(tokenCode);

  if (signedPayload) {
    // Check if token in local memory DB has been used
    const tokenRecord = await getToken(tokenCode);

    return NextResponse.json({
      valid: true,
      code: tokenCode,
      is_used: tokenRecord ? tokenRecord.is_used : false,
      claimed_at: tokenRecord ? tokenRecord.claimed_at : undefined,
      prize_won: tokenRecord ? tokenRecord.prize_won : null,
      slice_index: tokenRecord ? tokenRecord.slice_index : null,
      customer_name: signedPayload.name,
      phone: signedPayload.phone,
      prizes,
    });
  }

  // 2. Fallback check for legacy DB token
  const tokenRecord = await getToken(tokenCode);

  if (!tokenRecord) {
    return NextResponse.json({
      valid: false,
      prizes,
      error: "Invalid Spin Token. Please register to get a valid spin scroll.",
    });
  }

  return NextResponse.json({
    valid: true,
    code: tokenRecord.code,
    is_used: tokenRecord.is_used,
    claimed_at: tokenRecord.claimed_at,
    prize_won: tokenRecord.prize_won || null,
    slice_index: tokenRecord.slice_index !== undefined ? tokenRecord.slice_index : null,
    customer_name: tokenRecord.customer_name,
    phone: tokenRecord.phone,
    prizes,
  });
}
