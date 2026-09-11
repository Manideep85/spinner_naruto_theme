import { POST as registerPOST } from "../app/api/register/route";
import { POST as spinPOST } from "../app/api/spin/route";
import { GET as verifyGET } from "../app/api/verify/route";
import { GET as tokensGET } from "../app/api/tokens/route";
import { prisma } from "../lib/prisma";

function createMockRequest(url: string, method: string = "GET", body?: any, headers: Record<string, string> = {}) {
  const reqHeaders = new Headers(headers);
  if (body) reqHeaders.set("Content-Type", "application/json");

  return new Request(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runApiCloudIntegrationTest() {
  console.log("☁️ TESTING FULL API FLOW DIRECTLY AGAINST LIVE SUPABASE POSTGRESQL DB...");

  const testPhone = "9777666555";
  const testName = "Live Cloud Tester";

  // Clean up existing test data from Supabase
  console.log("0. Cleaning up old test data from Supabase...");
  await prisma.customerRegistration.deleteMany({
    where: { phone: { endsWith: "777666555" } },
  });
  await prisma.spinLog.deleteMany({
    where: { phone: { endsWith: "777666555" } },
  });
  await prisma.tokenRecord.deleteMany({
    where: { phone: { endsWith: "777666555" } },
  });

  // Step 1: Call POST /api/register
  console.log("\n1. Calling POST /api/register...");
  const regReq = createMockRequest("http://localhost:3000/api/register", "POST", { name: testName, phone: testPhone });
  const regRes = await registerPOST(regReq);
  const regJson = await regRes.json();
  console.log("   API Register Status:", regRes.status, "Token:", regJson.token);
  if (!regJson.success || !regJson.token) throw new Error("API Register failed");

  // Verify record exists in Supabase DB immediately after /api/register
  const dbRegAfterRegister = await prisma.customerRegistration.findFirst({
    where: { phone: { endsWith: "777666555" } },
  });
  console.log("   ✅ Supabase DB check after register:", dbRegAfterRegister ? { name: dbRegAfterRegister.name, phone: dbRegAfterRegister.phone, token: dbRegAfterRegister.token_code } : "NOT FOUND IN DB");
  if (!dbRegAfterRegister) throw new Error("Customer registration was not saved to Supabase DB!");

  // Step 2: Call POST /api/spin
  console.log("\n2. Calling POST /api/spin...");
  const spinReq = createMockRequest("http://localhost:3000/api/spin", "POST", { token: regJson.token }, { "x-forwarded-for": "1.2.3.4" });
  const spinRes = await spinPOST(spinReq);
  const spinJson = await spinRes.json();
  console.log("   API Spin Status:", spinRes.status, "Prize Won:", spinJson.prize?.name);
  if (!spinJson.success || !spinJson.prize) throw new Error("API Spin failed");

  // Verify record updated in Supabase DB immediately after /api/spin
  const dbRegAfterSpin = await prisma.customerRegistration.findFirst({
    where: { phone: { endsWith: "777666555" } },
  });
  console.log("   ✅ Supabase DB check after spin:", dbRegAfterSpin ? { name: dbRegAfterSpin.name, prize_won: dbRegAfterSpin.prize_won, claimed_at: dbRegAfterSpin.claimed_at } : "NOT FOUND IN DB");
  if (!dbRegAfterSpin || (!dbRegAfterSpin.prize_won && !spinJson.prize.name.includes("RE-SPIN"))) {
    throw new Error("Customer registration prize was not updated in Supabase DB!");
  }

  // Step 3: Fetch Admin Data via GET /api/tokens
  console.log("\n3. Calling GET /api/tokens (Admin Data Fetch)...");
  const adminReq = createMockRequest("http://localhost:3000/api/tokens?pin=1234", "GET");
  const adminRes = await tokensGET(adminReq);
  const adminJson = await adminRes.json();
  console.log("   Admin Registrations Count:", adminJson.registrations?.length);
  const adminUserRecord = adminJson.registrations.find((r: any) => r.phone.includes("777666555"));
  console.log("   ✅ Admin User Record in Cloud DB:", adminUserRecord);
  if (!adminUserRecord) throw new Error("Admin GET did not return registered user from Supabase DB!");

  // Clean up test record from Supabase
  console.log("\n4. Cleaning up test data from Supabase DB...");
  await prisma.customerRegistration.deleteMany({
    where: { phone: { endsWith: "777666555" } },
  });
  await prisma.spinLog.deleteMany({
    where: { phone: { endsWith: "777666555" } },
  });

  console.log("\n🎉 ALL API ENDPOINTS ARE WRITING 100% DIRECTLY TO SUPABASE CLOUD POSTGRESQL DB!");
}

runApiCloudIntegrationTest().catch((err) => {
  console.error("❌ API Cloud Integration Test Failed:", err);
  process.exit(1);
});
