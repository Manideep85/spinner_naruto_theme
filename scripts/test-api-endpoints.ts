import { POST as registerPOST } from "../app/api/register/route";
import { POST as spinPOST } from "../app/api/spin/route";
import { GET as verifyGET } from "../app/api/verify/route";
import { GET as tokensGET, POST as tokensPOST } from "../app/api/tokens/route";
import { deleteRegistration, getAllRegistrations } from "../lib/db";

function createMockRequest(url: string, method: string = "GET", body?: any, headers: Record<string, string> = {}) {
  const reqHeaders = new Headers(headers);
  if (body) reqHeaders.set("Content-Type", "application/json");

  return new Request(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function runApiTestSuite() {
  console.log("🚀 STARTING COMPREHENSIVE API ENDPOINT TEST SUITE...");

  const testPhone = "9123456789";
  const testName = "API Test Ninja";
  let generatedToken = "";
  let registrationId = "";

  // -------------------------------------------------------------
  // TEST 1: POST /api/register (Validation Errors)
  // -------------------------------------------------------------
  console.log("\n1. Testing POST /api/register (Validation & Input Error Handling)...");
  
  const invalidNameReq = createMockRequest("http://localhost:3000/api/register", "POST", { name: "", phone: "9123456789" });
  const invalidNameRes = await registerPOST(invalidNameReq);
  const invalidNameJson = await invalidNameRes.json();
  console.log("   Empty Name Status:", invalidNameRes.status, "Error:", invalidNameJson.error);
  if (invalidNameRes.status !== 400) throw new Error("Expected status 400 for empty name");

  const invalidPhoneReq = createMockRequest("http://localhost:3000/api/register", "POST", { name: "Sasuke", phone: "12345" });
  const invalidPhoneRes = await registerPOST(invalidPhoneReq);
  const invalidPhoneJson = await invalidPhoneRes.json();
  console.log("   Invalid Phone Status:", invalidPhoneRes.status, "Error:", invalidPhoneJson.error);
  if (invalidPhoneRes.status !== 400) throw new Error("Expected status 400 for invalid phone");

  // -------------------------------------------------------------
  // TEST 2: POST /api/register (Successful Registration)
  // -------------------------------------------------------------
  console.log("\n2. Testing POST /api/register (Successful Customer Registration)...");
  const validRegReq = createMockRequest("http://localhost:3000/api/register", "POST", { name: testName, phone: testPhone });
  const validRegRes = await registerPOST(validRegReq);
  const validRegJson = await validRegRes.json();
  console.log("   Success Status:", validRegRes.status, "Token:", validRegJson.token);
  if (!validRegJson.success || !validRegJson.token) throw new Error("Registration failed");
  generatedToken = validRegJson.token;

  // -------------------------------------------------------------
  // TEST 3: POST /api/register (Duplicate Phone Registration Lock)
  // -------------------------------------------------------------
  console.log("\n3. Testing POST /api/register (Duplicate Phone Lock Prevention)...");
  const dupRegReq = createMockRequest("http://localhost:3000/api/register", "POST", { name: testName, phone: testPhone });
  const dupRegRes = await registerPOST(dupRegReq);
  const dupRegJson = await dupRegRes.json();
  console.log("   Duplicate Lock Status:", dupRegRes.status, "Is Used:", dupRegJson.is_used, "Error:", dupRegJson.error);
  if (dupRegRes.status !== 403 || !dupRegJson.is_used) throw new Error("Duplicate phone registration lock failed");

  // -------------------------------------------------------------
  // TEST 4: GET /api/verify (Token Status Check)
  // -------------------------------------------------------------
  console.log("\n4. Testing GET /api/verify (Token Status Verification)...");
  const verifyReq = createMockRequest(`http://localhost:3000/api/verify?token=${encodeURIComponent(generatedToken)}`, "GET");
  const verifyRes = await verifyGET(verifyReq);
  const verifyJson = await verifyRes.json();
  console.log("   Verify Valid:", verifyJson.valid, "Is Used:", verifyJson.is_used, "Prizes Count:", verifyJson.prizes?.length);
  if (!verifyJson.valid || verifyJson.is_used !== false) throw new Error("Token verification failed");

  // -------------------------------------------------------------
  // TEST 5: POST /api/spin (Wheel Spin Execution)
  // -------------------------------------------------------------
  console.log("\n5. Testing POST /api/spin (Spin Execution & Reward Claim)...");
  const spinReq = createMockRequest("http://localhost:3000/api/spin", "POST", { token: generatedToken }, { "x-forwarded-for": "1.2.3.4" });
  const spinRes = await spinPOST(spinReq);
  const spinJson = await spinRes.json();
  console.log("   Spin Status:", spinRes.status, "Prize Won:", spinJson.prize?.name, "Slice Index:", spinJson.sliceIndex, "WhatsApp:", spinJson.whatsappLink ? "Generated" : "None");
  if (!spinJson.success || !spinJson.prize) throw new Error("Spin execution failed");

  // -------------------------------------------------------------
  // TEST 6: POST /api/spin (Second Spin Attempt Rejection)
  // -------------------------------------------------------------
  console.log("\n6. Testing POST /api/spin (Second Spin Attempt Rejection)...");
  const secondSpinReq = createMockRequest("http://localhost:3000/api/spin", "POST", { token: generatedToken });
  const secondSpinRes = await spinPOST(secondSpinReq);
  const secondSpinJson = await secondSpinRes.json();
  console.log("   Rejection Status:", secondSpinRes.status, "Is Used:", secondSpinJson.is_used, "Error:", secondSpinJson.error);
  if (secondSpinRes.status !== 403 || !secondSpinJson.is_used) throw new Error("Second spin rejection failed");

  // -------------------------------------------------------------
  // TEST 7: GET /api/tokens (Admin Authentication & Data Fetching)
  // -------------------------------------------------------------
  console.log("\n7. Testing GET /api/tokens (Admin Authentication & Data Retrieval)...");
  const badPinReq = createMockRequest("http://localhost:3000/api/tokens?pin=WRONGPIN", "GET");
  const badPinRes = await tokensGET(badPinReq);
  console.log("   Unauthorized Status:", badPinRes.status);
  if (badPinRes.status !== 401) throw new Error("Expected status 401 for wrong admin PIN");

  const validPinReq = createMockRequest("http://localhost:3000/api/tokens?pin=1234", "GET");
  const validPinRes = await tokensGET(validPinReq);
  const validPinJson = await validPinRes.json();
  console.log("   Admin Auth Success:", validPinJson.success);
  console.log("   Registrations Count:", validPinJson.registrations?.length);
  console.log("   Tokens Count:", validPinJson.tokens?.length);
  console.log("   Logs Count:", validPinJson.logs?.length);
  console.log("   Prizes Count:", validPinJson.prizes?.length);
  if (!validPinJson.success || !Array.isArray(validPinJson.registrations)) throw new Error("Admin GET data failed");

  const regRecord = validPinJson.registrations.find((r: any) => r.phone === testPhone);
  if (regRecord) registrationId = regRecord.id;

  // -------------------------------------------------------------
  // TEST 8: POST /api/tokens (Admin Actions: Batch Token & Odds Update)
  // -------------------------------------------------------------
  console.log("\n8. Testing POST /api/tokens (Admin Batch Token Creation & Prize Odds Update)...");
  
  // Create Single Token
  const singleTokenReq = createMockRequest("http://localhost:3000/api/tokens", "POST", { action: "create_single", pin: "1234", code: "APITEST-99", note: "API Test Single" });
  const singleTokenRes = await tokensPOST(singleTokenReq);
  const singleTokenJson = await singleTokenRes.json();
  console.log("   Create Single Token Result:", singleTokenJson.success, "Code:", singleTokenJson.token?.code);
  if (!singleTokenJson.success) throw new Error("Create single token failed");

  // Batch Tokens
  const batchReq = createMockRequest("http://localhost:3000/api/tokens", "POST", { action: "generate_batch", pin: "1234", count: 3, prefix: "APIBATCH" });
  const batchRes = await tokensPOST(batchReq);
  const batchJson = await batchRes.json();
  console.log("   Generate Batch Result:", batchJson.success, "Count:", batchJson.createdCount);
  if (!batchJson.success || batchJson.createdCount !== 3) throw new Error("Generate token batch failed");

  // Update Prizes Odds
  const updatedPrizes = validPinJson.prizes.map((p: any) => p.id === "5-percent-off" ? { ...p, weight: 15 } : p);
  const updatePrizesReq = createMockRequest("http://localhost:3000/api/tokens", "POST", { action: "update_prizes", pin: "1234", prizes: updatedPrizes });
  const updatePrizesRes = await tokensPOST(updatePrizesReq);
  const updatePrizesJson = await updatePrizesRes.json();
  const updatedGaara = updatePrizesJson.prizes.find((p: any) => p.id === "5-percent-off");
  console.log("   Update Odds Result:", updatePrizesJson.success, "Gaara Weight:", updatedGaara?.weight);
  if (!updatePrizesJson.success || updatedGaara?.weight !== 15) throw new Error("Update prizes odds failed");

  // Reset Prize Odds Back
  const resetPrizes = validPinJson.prizes.map((p: any) => p.id === "5-percent-off" ? { ...p, weight: 5 } : p);
  await tokensPOST(createMockRequest("http://localhost:3000/api/tokens", "POST", { action: "update_prizes", pin: "1234", prizes: resetPrizes }));

  // -------------------------------------------------------------
  // TEST 9: POST /api/tokens (Delete Registration & Unlock)
  // -------------------------------------------------------------
  console.log("\n9. Testing POST /api/tokens (Delete Registration Action)...");
  if (registrationId) {
    const deleteReq = createMockRequest("http://localhost:3000/api/tokens", "POST", { action: "delete_registration", pin: "1234", id: registrationId });
    const deleteRes = await tokensPOST(deleteReq);
    const deleteJson = await deleteRes.json();
    console.log("   Delete Action Result:", deleteJson.success);
    if (!deleteJson.success) throw new Error("Delete registration API action failed");
  }

  console.log("\n🎉 ALL API ENDPOINTS TESTED AND VERIFIED 100% WORKING!");
}

runApiTestSuite()
  .catch((err) => {
    console.error("❌ API Test Suite Failed:", err);
    process.exit(1);
  });
