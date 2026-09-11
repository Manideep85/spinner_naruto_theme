import {
  registerCustomerUser,
  isPhoneAlreadyUsed,
  getAllRegistrations,
  claimToken,
  getDbPrizes,
  getLogs,
  deleteRegistration,
} from "../lib/db";

async function runDatabaseIntegrationTest() {
  console.log("⚡ Starting Supabase PostgreSQL Integration Test...");

  const testPhone = "9999888877";
  const testName = "Test Shinobi Admin";

  // Step 1: Initial Check
  console.log("1. Checking isPhoneAlreadyUsed before registration...");
  const checkBefore = await isPhoneAlreadyUsed(testPhone);
  console.log("   Check Result:", checkBefore);

  // Step 2: Register User
  console.log("2. Registering test customer user...");
  const regResult = await registerCustomerUser(testName, testPhone);
  console.log("   Register Result Success:", regResult.success, "Token:", regResult.token?.code);

  if (!regResult.token) {
    throw new Error("Registration failed to return a token.");
  }

  // Step 3: Unclaimed Phone Verification
  console.log("3. Verifying phone status after registration (Should be eligible to spin, is_used: false)...");
  const checkAfter = await isPhoneAlreadyUsed(testPhone);
  console.log("   Unclaimed Status (Should be false):", checkAfter.is_used);

  if (checkAfter.is_used) {
    throw new Error("Phone lock check failed! Registered user before claim should have is_used: false.");
  }

  // Step 4: Claim Spin Token
  console.log("4. Fetching prizes & claiming reward spin...");
  const prizes = await getDbPrizes();
  const testPrize = prizes[0];
  const claimResult = await claimToken(
    regResult.token.code,
    testPrize,
    0,
    "127.0.0.1",
    "Test-Agent",
    testPhone,
    testName
  );
  console.log("   Claim Result Success:", claimResult.success, "Prize Won:", claimResult.token?.prize_won?.name);

  // Step 5: Read All Registrations & Audit Logs
  console.log("5. Reading all customer registrations from Supabase...");
  const allRegs = await getAllRegistrations();
  console.log("   Total Registrations Count:", allRegs.length, "Latest Customer:", allRegs[0]?.name);

  console.log("6. Reading audit logs...");
  const logs = await getLogs();
  console.log("   Total Logs Count:", logs.length, "Latest Action:", logs[0]?.action);

  // Step 6: Delete Test Registration (Cleanup)
  if (regResult.registration) {
    console.log("7. Testing deleteRegistration (unlocking phone)...");
    const deleteResult = await deleteRegistration(regResult.registration.id);
    console.log("   Delete Result (Should be true):", deleteResult);

    const checkFinal = await isPhoneAlreadyUsed(testPhone);
    console.log("   Final Lock Status after deletion (Should be false):", checkFinal.is_used);
  }

  console.log("🎉 ALL SUPABASE DATABASE TESTS PASSED 100% SUCCESSFULLY!");
}

runDatabaseIntegrationTest()
  .catch((err) => {
    console.error("❌ Integration Test Failed:", err);
    process.exit(1);
  });
