import { prisma } from "../lib/prisma";

async function testCloudDatabaseDirectly() {
  console.log("📡 TESTING DIRECT SUPABASE CLOUD POSTGRESQL CONNECTION...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));

  try {
    // 1. Query raw database time
    const timeResult = await prisma.$queryRaw`SELECT NOW(), current_database(), current_user`;
    console.log("✅ 1. Supabase Connection Successful! Result:", timeResult);

    // 2. Count existing registrations in Cloud Supabase DB
    const countBefore = await prisma.customerRegistration.count();
    console.log("✅ 2. Current Cloud Customer Registrations Count:", countBefore);

    // 3. Create a test customer registration directly in Cloud Supabase DB
    const testId = "test-" + Math.random().toString(36).substring(2, 7);
    const testPhone = "9988776655";
    const testName = "Cloud Test Shinobi";
    const testToken = "NINJA-CLOUDTEST";

    // Clean up existing if any
    await prisma.customerRegistration.deleteMany({
      where: { phone: testPhone },
    });
    await prisma.tokenRecord.deleteMany({
      where: { code: testToken },
    });

    // 3. Create TokenRecord FIRST in Cloud Supabase DB
    console.log("3. Inserting TokenRecord into Cloud Supabase...");
    const token = await prisma.tokenRecord.create({
      data: {
        code: testToken,
        is_used: false,
        created_at: new Date(),
        customer_name: testName,
        phone: testPhone,
        note: "Direct Cloud Test Token",
      },
    });
    console.log("✅ 3. TokenRecord Created Successfully in Cloud:", token);

    // 4. Create CustomerRegistration referencing TokenRecord in Cloud Supabase DB
    console.log("4. Inserting CustomerRegistration into Cloud Supabase...");
    const reg = await prisma.customerRegistration.create({
      data: {
        id: testId,
        name: testName,
        phone: testPhone,
        token_code: testToken,
        registered_at: new Date(),
      },
    });
    console.log("✅ 4. CustomerRegistration Created Successfully in Cloud:", reg);

    // 5. Query back all registrations from Cloud Supabase DB
    const allRegs = await prisma.customerRegistration.findMany({
      orderBy: { registered_at: "desc" },
    });
    console.log("✅ 5. Fetched all registrations from Cloud Supabase DB:");
    console.table(allRegs.map(r => ({ id: r.id, name: r.name, phone: r.phone, token: r.token_code, prize: r.prize_won, claimed_at: r.claimed_at })));

    // Cleanup test record
    await prisma.customerRegistration.delete({ where: { id: testId } });
    await prisma.tokenRecord.delete({ where: { code: testToken } });
    console.log("✅ 6. Cleaned up test record successfully.");

    console.log("\n🎉 ALL DIRECT CLOUD DATABASE OPERATIONS PASSED 100%!");
  } catch (error: any) {
    console.error("❌ DIRECT CLOUD DATABASE ERROR:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testCloudDatabaseDirectly();
