import { NextResponse } from "next/server";
import { getToken, claimToken, getDbPrizes, registerCustomerUser } from "@/lib/db";
import { verifySignedToken } from "@/lib/tokens";
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

    let customerName = "Shinobi Customer";
    let customerPhone = "";

    // 1. Verify signed Vercel token
    const signedPayload = verifySignedToken(tokenCode);
    if (signedPayload) {
      customerName = signedPayload.name;
      customerPhone = signedPayload.phone;
    } else {
      // Check legacy DB token
      const dbToken = await getToken(tokenCode);
      if (!dbToken) {
        return NextResponse.json(
          { success: false, error: "Invalid Spin Token. Access Denied." },
          { status: 404 }
        );
      }
      customerName = dbToken.customer_name || customerName;
      customerPhone = dbToken.phone || customerPhone;
    }

    // Check single-use lock
    const tokenRecord = await getToken(tokenCode);
    if (tokenRecord && tokenRecord.is_used) {
      const waLink = customerPhone && tokenRecord.prize_won
        ? generateWhatsAppLink(customerPhone, tokenRecord.prize_won.name, customerName)
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

    // 2. Secret server prize calculation
    const currentPrizes = await getDbPrizes();
    const { prize, sliceIndex } = selectServerPrize(currentPrizes);

    // 3. Mark token as claimed
    const result = await claimToken(tokenCode, prize, sliceIndex, ip, userAgent, customerPhone, customerName);

    const whatsappLink = customerPhone
      ? generateWhatsAppLink(customerPhone, prize.name, customerName)
      : null;

    return NextResponse.json({
      success: true,
      sliceIndex,
      prize,
      token: tokenCode,
      claimedAt: result.token?.claimed_at || new Date().toISOString(),
      whatsappLink,
      customerName,
      phone: customerPhone,
    });
  } catch (error) {
    console.error("Spin route error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Jutsu Server Error." },
      { status: 500 }
    );
  }
}
