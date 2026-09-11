import { POST as registerPOST } from "../app/api/register/route";
import { POST as spinPOST } from "../app/api/spin/route";
import { GET as verifyGET } from "../app/api/verify/route";
import { GET as tokensGET } from "../app/api/tokens/route";
import { claimToken, deleteRegistration } from "../lib/db";
import { INITIAL_PRIZES } from "../lib/prizes";

function createMockRequest(url: string, method: string = "GET", body?: any, headers: Record<string, string> = {}) {
  const reqHeaders = new Headers(headers);
  if (body) reqHeaders.set("Content-Type", "application/json");

  return new Request(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runRespinLifecycleTest() {
  console.log("⚡ TESTING RESPIN & REGISTRATION CLAIM LIFECYCLE...");

  const testPhone = "9888877777";
  const testName = "Naruto Uzumaki Test";
  let token1 = "";

  // 1. Register User
  console.log("\n1. Registering user for the first time...");
  const regReq1 = createMockRequest("http://localhost:3000/api/register", "POST", { name: testName, phone: testPhone });
  const regRes1 = await registerPOST(regReq1);
  const regJson1 = await regRes1.json();
  console.log("   Registration 1 Response:", regJson1);
  if (!regJson1.success || !regJson1.token) throw new Error("Initial registration failed");
  token1 = regJson1.token;

  // 2. Check Admin Status (Should be REGISTERED, not CLAIMED)
  console.log("\n2. Checking Admin Panel Status (Unclaimed User)...");
  const adminReq1 = createMockRequest("http://localhost:3000/api/tokens?pin=1234", "GET");
  const adminRes1 = await tokensGET(adminReq1);
  const adminJson1 = await adminRes1.json();
  const userReg1 = adminJson1.registrations.find((r: any) => r.phone === testPhone);
  console.log("   User Reg 1 Status in Admin:", userReg1 ? { name: userReg1.name, prize_won: userReg1.prize_won, claimed_at: userReg1.claimed_at } : "NOT FOUND");
  if (!userReg1 || userReg1.claimed_at !== undefined) throw new Error("Unclaimed user should have claimed_at undefined");

  // 3. User Re-enters phone before spinning (Simulate refresh or re-registration)
  console.log("\n3. User re-enters phone before spinning...");
  const regReq2 = createMockRequest("http://localhost:3000/api/register", "POST", { name: testName, phone: testPhone });
  const regRes2 = await registerPOST(regReq2);
  const regJson2 = await regRes2.json();
  console.log("   Re-registration Response:", regJson2);
  if (!regJson2.success || !regJson2.token) throw new Error("Re-registration should return a valid signed token");

  // 4. Simulate winning RE-SPIN CHAKRA
  console.log("\n4. Simulating spin winning RE-SPIN CHAKRA...");
  const respinPrize = INITIAL_PRIZES.find((p) => p.id === "re-spin-chakra")!;
  const claimRespinResult = await claimToken(token1, respinPrize, 2, "127.0.0.1", "test-agent", testPhone, testName);
  console.log("   Claim RE-SPIN result:", { is_used: claimRespinResult.token?.is_used, claimed_at: claimRespinResult.token?.claimed_at });
  if (claimRespinResult.token?.is_used !== false) throw new Error("Token should remain is_used: false on RE-SPIN");

  // 5. Verify user can spin again after RE-SPIN
  console.log("\n5. Verifying user can spin again after RE-SPIN...");
  const verifyReq2 = createMockRequest(`http://localhost:3000/api/verify?token=${encodeURIComponent(token1)}`, "GET");
  const verifyRes2 = await verifyGET(verifyReq2);
  const verifyJson2 = await verifyRes2.json();
  console.log("   Verify Status after RE-SPIN:", { valid: verifyJson2.valid, is_used: verifyJson2.is_used, prize_won: verifyJson2.prize_won });
  if (!verifyJson2.valid || verifyJson2.is_used !== false) throw new Error("User should still be allowed to spin after RE-SPIN");

  // 6. Simulate winning a final non-respin prize (e.g. 10% OFF)
  console.log("\n6. Simulating spin winning a final non-respin prize (10% OFF)...");
  const finalPrize = INITIAL_PRIZES.find((p) => p.id === "10-percent-off")!;
  const claimFinalResult = await claimToken(token1, finalPrize, 1, "127.0.0.1", "test-agent", testPhone, testName);
  console.log("   Claim Final Prize result:", { is_used: claimFinalResult.token?.is_used, claimed_at: claimFinalResult.token?.claimed_at, prize_won: claimFinalResult.token?.prize_won?.name });
  if (claimFinalResult.token?.is_used !== true || !claimFinalResult.token?.claimed_at) throw new Error("Token should be locked on final prize claim");

  // 7. Verify subsequent registration for this phone is BLOCKED
  console.log("\n7. Verifying subsequent registration for claimed phone is BLOCKED...");
  const regReq3 = createMockRequest("http://localhost:3000/api/register", "POST", { name: testName, phone: testPhone });
  const regRes3 = await registerPOST(regReq3);
  const regJson3 = await regRes3.json();
  console.log("   Blocked Registration Status:", regRes3.status, "Is Used:", regJson3.is_used);
  if (regRes3.status !== 403 || regJson3.is_used !== true) throw new Error("Claimed phone registration was not blocked");

  // 8. Cleanup test registration
  console.log("\n8. Cleaning up test data...");
  const adminReq2 = createMockRequest("http://localhost:3000/api/tokens?pin=1234", "GET");
  const adminRes2 = await tokensGET(adminReq2);
  const adminJson2 = await adminRes2.json();
  const testReg = adminJson2.registrations.find((r: any) => r.phone === testPhone);
  if (testReg) {
    await deleteRegistration(testReg.id);
  }

  console.log("\n🎉 ALL RESPIN & REGISTRATION LIFECYCLE TESTS PASSED PERFECTLY!");
}

runRespinLifecycleTest().catch((err) => {
  console.error("❌ Respin Lifecycle Test Failed:", err);
  process.exit(1);
});
