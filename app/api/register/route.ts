import { NextResponse } from "next/server";
import { createSignedToken } from "@/lib/tokens";
import { registerCustomerUser, isPhoneAlreadyUsed } from "@/lib/db";
import { validateMobileNumber } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }

    const phoneValidation = validateMobileNumber(phone || "");
    if (!phoneValidation.valid) {
      return NextResponse.json(
        { success: false, error: phoneValidation.error || "Please enter a valid 10-digit mobile phone number." },
        { status: 400 }
      );
    }

    const cleanPhone = phoneValidation.cleanPhone;

    // 1. Strict Phone Lock Check: Prevent already registered phone numbers from getting a new spin
    const phoneCheck = isPhoneAlreadyUsed(cleanPhone);
    if (phoneCheck.is_used) {
      return NextResponse.json(
        {
          success: false,
          is_used: true,
          error: "This phone number has already been registered and used its single-use spin!",
          prize_won: phoneCheck.prize_won,
          claimed_at: phoneCheck.claimed_at,
        },
        { status: 403 }
      );
    }

    // 2. Generate signed token
    const tokenCode = createSignedToken(name, phone);
    registerCustomerUser(name, phone);

    return NextResponse.json({
      success: true,
      token: tokenCode,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register user." },
      { status: 500 }
    );
  }
}
