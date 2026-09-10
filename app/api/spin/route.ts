import { NextResponse } from "next/server";
import { getToken, claimToken, getDbPrizes } from "@/lib/db";
import { generateWhatsAppLink } from "@/lib/utils";
import { selectServerPrize } from "@/lib/prizes";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token: tokenCode } = body;

    if (!tokenCode) {
      return NextResponse.json(
        { success: false, error: "Missing spin token." },
        { status: 400 }
      );
    }

    const tokenRecord = getToken(tokenCode);

    if (!tokenRecord) {
      return NextResponse.json(
        { success: false, error: "Invalid Spin Token. Access Denied." },
        { status: 404 }
      );
    }

    if (tokenRecord.is_used) {
      const waLink = tokenRecord.phone && tokenRecord.prize_won
        ? generateWhatsAppLink(tokenRecord.phone, tokenRecord.prize_won.name, tokenRecord.customer_name)
        : null;

      return NextResponse.json(
        {
          success: false,
          error: "Scroll Already Unsealed! This token has already been spun.",
          is_used: true,
          prize_won: tokenRecord.prize_won,
          claimed_at: tokenRecord.claimed_at,
          whatsappLink: waLink,
        },
        { status: 403 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const currentPrizes = getDbPrizes();
    const { prize, sliceIndex } = selectServerPrize(currentPrizes);

    const result = claimToken(tokenCode, prize, sliceIndex, ip, userAgent);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to execute spin." },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sliceIndex,
      prize,
      token: result.token?.code,
      claimedAt: result.token?.claimed_at,
      whatsappLink: result.whatsappLink,
      customerName: result.token?.customer_name,
      phone: result.token?.phone,
    });
  } catch (error) {
    console.error("Spin route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Jutsu Server Error." },
      { status: 500 }
    );
  }
}
