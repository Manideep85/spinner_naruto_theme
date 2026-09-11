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

const getCleanAdminPin = () => (process.env.ADMIN_PIN || "1234").replace(/['"]/g, "").trim();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get("pin");
    const adminPin = getCleanAdminPin();
    const cleanPin = (pin || "").replace(/[\'"]/g, "").trim();

    if (cleanPin !== adminPin) {
      return NextResponse.json(
        { error: "Unauthorized Shinobi Admin Pin Required." },
        { status: 401 }
      );
    }

    if (!process.env.DATABASE_URL?.trim()) {
      return NextResponse.json(
        { success: false, error: "DATABASE_URL is not configured. Add the cloud PostgreSQL connection string to the server environment." },
        { status: 503 }
      );
    }

    const tokens = await getAllTokens();
    const logs = await getLogs();
    const prizes = await getDbPrizes();
    const registrations = await getAllRegistrations();

    return NextResponse.json({
      success: true,
      tokens,
      logs,
      prizes,
      registrations,
    });
  } catch (error) {
    console.error("Admin data load error:", error);
    const databaseError = error as { code?: string };
    return NextResponse.json(
      {
        success: false,
        error: "Cloud database unavailable. Please try again.",
        error_code: databaseError.code || "CLOUD_DATABASE_ERROR",
      },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, pin, code, note, count, prefix, prizes, id } = body;
    const adminPin = getCleanAdminPin();
    const cleanPin = (pin || "").replace(/['"]/g, "").trim();

    if (cleanPin !== adminPin) {
      return NextResponse.json(
        { error: "Unauthorized Shinobi Admin Pin Required." },
        { status: 401 }
      );
    }

    if (action === "create_single") {
      if (!code) {
        return NextResponse.json({ error: "Token code is required." }, { status: 400 });
      }
      const token = await createToken(code, note);
      return NextResponse.json({ success: true, token });
    }

    if (action === "generate_batch") {
      const num = parseInt(count) || 5;
      const batchPrefix = prefix || "SHINOBI";
      const created = await generateTokenBatch(num, batchPrefix);
      return NextResponse.json({ success: true, createdCount: created.length, tokens: created });
    }

    if (action === "reset_token") {
      if (!code) {
        return NextResponse.json({ error: "Token code required." }, { status: 400 });
      }
      const resetOk = await resetToken(code);
      return NextResponse.json({ success: resetOk });
    }

    if (action === "delete_registration") {
      if (!id) {
        return NextResponse.json({ error: "Registration ID required." }, { status: 400 });
      }
      const deleteOk = await deleteRegistration(id);
      return NextResponse.json({ success: deleteOk, registrations: await getAllRegistrations() });
    }

    if (action === "update_prizes") {
      if (!Array.isArray(prizes)) {
        return NextResponse.json({ error: "Prizes array required." }, { status: 400 });
      }
      await updateDbPrizes(prizes);
      return NextResponse.json({ success: true, prizes: await getDbPrizes() });
    }

    return NextResponse.json({ error: "Invalid action type." }, { status: 400 });
  } catch (err) {
    console.error("Token API Error:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
