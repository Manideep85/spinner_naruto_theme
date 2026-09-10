import { NextResponse } from "next/server";
import {
  getAllTokens,
  createToken,
  generateTokenBatch,
  resetToken,
  getLogs,
  getDbPrizes,
  updateDbPrizes,
  getAllRegistrations,
  deleteRegistration,
} from "@/lib/db";

const ADMIN_PIN = process.env.ADMIN_PIN || "1234";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pin = searchParams.get("pin");

  if (pin !== ADMIN_PIN) {
    return NextResponse.json(
      { error: "Unauthorized Shinobi Admin Pin Required." },
      { status: 401 }
    );
  }

  const tokens = getAllTokens();
  const logs = getLogs();
  const prizes = getDbPrizes();
  const registrations = getAllRegistrations();

  return NextResponse.json({
    success: true,
    tokens,
    logs,
    prizes,
    registrations,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, pin, code, note, count, prefix, prizes, id } = body;

    if (pin !== ADMIN_PIN) {
      return NextResponse.json(
        { error: "Unauthorized Shinobi Admin Pin Required." },
        { status: 401 }
      );
    }

    if (action === "create_single") {
      if (!code) {
        return NextResponse.json({ error: "Token code is required." }, { status: 400 });
      }
      const token = createToken(code, note);
      return NextResponse.json({ success: true, token });
    }

    if (action === "generate_batch") {
      const num = parseInt(count) || 5;
      const batchPrefix = prefix || "SHINOBI";
      const created = generateTokenBatch(num, batchPrefix);
      return NextResponse.json({ success: true, createdCount: created.length, tokens: created });
    }

    if (action === "reset_token") {
      if (!code) {
        return NextResponse.json({ error: "Token code required." }, { status: 400 });
      }
      const resetOk = resetToken(code);
      return NextResponse.json({ success: resetOk });
    }

    if (action === "delete_registration") {
      if (!id) {
        return NextResponse.json({ error: "Registration ID required." }, { status: 400 });
      }
      const deleteOk = deleteRegistration(id);
      return NextResponse.json({ success: deleteOk, registrations: getAllRegistrations() });
    }

    if (action === "update_prizes") {
      if (!Array.isArray(prizes)) {
        return NextResponse.json({ error: "Prizes array required." }, { status: 400 });
      }
      updateDbPrizes(prizes);
      return NextResponse.json({ success: true, prizes: getDbPrizes() });
    }

    return NextResponse.json({ error: "Invalid action type." }, { status: 400 });
  } catch (err) {
    console.error("Token API Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
