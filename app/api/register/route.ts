import { NextResponse } from "next/server";
import { registerCustomerUser } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone } = body;

    if (!phone || phone.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid phone number." },
        { status: 400 }
      );
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your name." },
        { status: 400 }
      );
    }

    const { token, registration } = registerCustomerUser(name, phone);

    return NextResponse.json({
      success: true,
      token: token.code,
      registration,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register user." },
      { status: 500 }
    );
  }
}
