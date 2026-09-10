import { NextResponse } from "next/server";
import { getToken, getDbPrizes } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenCode = searchParams.get("token");

  const prizes = getDbPrizes();

  if (!tokenCode) {
    return NextResponse.json({
      valid: false,
      prizes,
      error: "No token provided in request.",
    });
  }

  const token = getToken(tokenCode);

  if (!token) {
    return NextResponse.json({
      valid: false,
      prizes,
      error: "Invalid Shinobi Ticket Code. This scroll does not exist.",
    });
  }

  return NextResponse.json({
    valid: true,
    code: token.code,
    is_used: token.is_used,
    claimed_at: token.claimed_at,
    prize_won: token.prize_won || null,
    slice_index: token.slice_index !== undefined ? token.slice_index : null,
    note: token.note,
    prizes,
  });
}
