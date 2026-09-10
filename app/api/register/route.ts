import { NextResponse } from "next/server";
import { createSignedToken } from "@/lib/tokens";
import { registerCustomerUser } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!phone || phone.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid 10-digit phone number." },
        { status: 400 }
      );
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }

    // 1. Create Vercel-compatible stateless signed token
    const tokenCode = createSignedToken(name, phone);

    // 2. Also record in local database/cache if writable
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
