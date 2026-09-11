import { prisma } from "../lib/prisma";
import { generateWhatsAppLink } from "../lib/utils";

async function seedCustomerRegistrationsToCloud() {
  console.log("🚀 POPULATING SUPABASE CLOUD DATABASE CUSTOMER REGISTRATIONS...");
  console.log("DATABASE_URL:", process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":****@"));

  const sampleCustomers = [
    {
      name: "Naruto Uzumaki",
      phone: "9876543210",
      token_code: "NINJA-NARUTO1",
      prize_won: "10% OFF",
      is_claimed: true,
      registered_mins_ago: 60,
    },
    {
      name: "Kakashi Hatake",
      phone: "9876543211",
      token_code: "NINJA-KAKASHI2",
      prize_won: "2 MAGNETS FOR ₹300",
      is_claimed: true,
      registered_mins_ago: 45,
    },
    {
      name: "Sasuke Uchiha",
      phone: "9876543212",
      token_code: "NINJA-SASUKE3",
      prize_won: "RE-SPIN CHAKRA",
      is_claimed: false, // Re-spin active
      registered_mins_ago: 30,
    },
    {
      name: "Sakura Haruno",
      phone: "9876543213",
      token_code: "NINJA-SAKURA4",
      prize_won: "5% OFF",
      is_claimed: true,
      registered_mins_ago: 15,
    },
    {
      name: "Shikamaru Nara",
      phone: "9876543214",
      token_code: "NINJA-SHIKA5",
      prize_won: null,
      is_claimed: false, // Just registered, not spun
      registered_mins_ago: 5,
    },
  ];

  try {
    for (const cust of sampleCustomers) {
      const regTime = new Date(Date.now() - cust.registered_mins_ago * 60 * 1000);
      const claimTime = cust.is_claimed ? new Date(regTime.getTime() + 2 * 60 * 1000) : null;
      const waLink = cust.prize_won ? generateWhatsAppLink(cust.phone, cust.prize_won, cust.name) : null;

      // 1. Upsert TokenRecord FIRST
      await prisma.tokenRecord.upsert({
        where: { code: cust.token_code },
        update: {
          is_used: cust.is_claimed,
          claimed_at: claimTime,
          phone: cust.phone,
          customer_name: cust.name,
          note: `Seeded Customer: ${cust.name}`,
        },
        create: {
          code: cust.token_code,
          is_used: cust.is_claimed,
          created_at: regTime,
          claimed_at: claimTime,
          phone: cust.phone,
          customer_name: cust.name,
          note: `Seeded Customer: ${cust.name}`,
        },
      });

      // 2. Upsert CustomerRegistration SECOND
      const existingReg = await prisma.customerRegistration.findFirst({
        where: { phone: cust.phone },
      });

      if (existingReg) {
        await prisma.customerRegistration.update({
          where: { id: existingReg.id },
          data: {
            name: cust.name,
            token_code: cust.token_code,
            prize_won: cust.prize_won,
            registered_at: regTime,
            claimed_at: claimTime,
            whatsapp_link: waLink,
          },
        });
      } else {
        await prisma.customerRegistration.create({
          data: {
            id: Math.random().toString(36).substring(2, 9),
            name: cust.name,
            phone: cust.phone,
            token_code: cust.token_code,
            prize_won: cust.prize_won,
            registered_at: regTime,
            claimed_at: claimTime,
            whatsapp_link: waLink,
          },
        });
      }

      // 3. Create SpinLog
      await prisma.spinLog.create({
        data: {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: claimTime || regTime,
          token: cust.token_code,
          action: cust.is_claimed ? "SPUN" : "REGISTERED",
          prize_won: cust.prize_won || undefined,
          phone: cust.phone,
        },
      });

      console.log(`✅ Inserted/Updated in Supabase DB: ${cust.name} (${cust.phone}) -> Prize: ${cust.prize_won || 'Registered (Not Spun)'}`);
    }

    const count = await prisma.customerRegistration.count();
    console.log(`\n🎉 SUCCESS! Total customer registrations in Supabase Cloud DB: ${count}`);

    const allRegs = await prisma.customerRegistration.findMany({
      orderBy: { registered_at: "desc" },
    });
    console.table(allRegs.map(r => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      token_code: r.token_code,
      prize_won: r.prize_won || "—",
      claimed_at: r.claimed_at ? r.claimed_at.toISOString() : "REGISTERED (NOT CLAIMED)"
    })));

  } catch (err: any) {
    console.error("❌ Error seeding records to Supabase Cloud DB:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedCustomerRegistrationsToCloud();
