import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const INITIAL_PRIZES = [
  {
    id: "better-luck-next-time",
    name: "NEXT TIME",
    character: "Sakura",
    description: "Caught in a Genjutsu mist! Better luck on your next ninja scroll.",
    rarity: "Common",
    weight: 60,
    color: "#E91E63",
    textColor: "#FFFFFF",
    icon: "",
    badge: "Sakura Blossom",
    enabled: true,
    order_index: 0,
  },
  {
    id: "2-magnets-300",
    name: "2 MAGNETS FOR ₹300",
    character: "Jiraiya",
    description: "Toad Sage Special Bundle: Get 2 custom Photo Magnets for just ₹300!",
    rarity: "Rare",
    weight: 25,
    color: "#D32F2F",
    textColor: "#FFFFFF",
    icon: "",
    badge: "Toad Sage",
    enabled: true,
    order_index: 1,
  },
  {
    id: "5-percent-off",
    name: "5% OFF",
    character: "Gaara",
    description: "Desert Sand Shield! Enjoy a 5% discount on your order!",
    rarity: "Common",
    weight: 5,
    color: "#FF9800",
    textColor: "#0B0D14",
    icon: "",
    badge: "Sand Shinobi",
    enabled: true,
    order_index: 2,
  },
  {
    id: "10-percent-off",
    name: "10% OFF",
    character: "Pain",
    description: "Almighty Push! Take 10% off your total purchase.",
    rarity: "Common",
    weight: 4,
    color: "#7B1FA2",
    textColor: "#FFFFFF",
    icon: "",
    badge: "Almighty Push",
    enabled: true,
    order_index: 3,
  },
  {
    id: "20-rupees-off",
    name: "₹20 OFF",
    character: "Rock Lee",
    description: "Primary Lotus Surge! Flat ₹20 discount applied instantly!",
    rarity: "Common",
    weight: 3,
    color: "#388E3C",
    textColor: "#FFFFFF",
    icon: "",
    badge: "Eight Gates",
    enabled: true,
    order_index: 4,
  },
  {
    id: "friend-pays-ramen",
    name: "RAMEN DEAL",
    character: "Sasuke",
    description: "Chidori Swap! Your ninja friend pays for your Ichiraku Ramen!",
    rarity: "Epic",
    weight: 2,
    color: "#1976D2",
    textColor: "#FFFFFF",
    icon: "",
    badge: "Chidori Swap",
    enabled: true,
    order_index: 5,
  },
  {
    id: "re-spin-chakra",
    name: "RE-SPIN CHAKRA",
    character: "Itachi",
    description: "Tsukuyomi Bonus! You earned a bonus re-spin ticket!",
    rarity: "Legendary",
    weight: 1,
    color: "#212121",
    textColor: "#FF4444",
    icon: "",
    badge: "Crow Genjutsu",
    enabled: true,
    order_index: 6,
  },
  {
    id: "free-photo-magnet",
    name: "FREE MAGNET",
    character: "Naruto",
    description: "Nine-Tails Gift! Claim a complimentary custom Photo Magnet!",
    rarity: "Rare",
    weight: 0,
    color: "#FF6B00",
    textColor: "#FFFFFF",
    icon: "",
    badge: "Nine-Tails",
    enabled: true,
    order_index: 7,
  },
];

async function main() {
  console.log("🌱 Seeding Database Prizes...");
  for (const prize of INITIAL_PRIZES) {
    await prisma.prizeRecord.upsert({
      where: { id: prize.id },
      update: {},
      create: prize,
    });
  }

  // Import existing registrations from JSON if available
  const legacyDbFile = path.join(process.cwd(), "data", "tokens_db.json");
  if (fs.existsSync(legacyDbFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(legacyDbFile, "utf-8"));
      if (Array.isArray(data.registrations)) {
        console.log(`📦 Importing ${data.registrations.length} legacy customer registrations...`);
        for (const reg of data.registrations) {
          if (!reg.phone || !reg.token_code) continue;

          // Upsert Token
          await prisma.tokenRecord.upsert({
            where: { code: reg.token_code },
            update: {
              is_used: Boolean(reg.prize_won || reg.claimed_at),
              claimed_at: reg.claimed_at ? new Date(reg.claimed_at) : undefined,
              customer_name: reg.name,
              phone: reg.phone,
            },
            create: {
              code: reg.token_code,
              is_used: Boolean(reg.prize_won || reg.claimed_at),
              created_at: reg.registered_at ? new Date(reg.registered_at) : new Date(),
              claimed_at: reg.claimed_at ? new Date(reg.claimed_at) : undefined,
              customer_name: reg.name,
              phone: reg.phone,
            },
          });

          // Upsert Registration
          await prisma.customerRegistration.upsert({
            where: { phone: reg.phone },
            update: {
              prize_won: reg.prize_won,
              claimed_at: reg.claimed_at ? new Date(reg.claimed_at) : undefined,
              whatsapp_link: reg.whatsapp_link,
            },
            create: {
              id: reg.id || Math.random().toString(36).substring(2, 9),
              name: reg.name || "Shinobi Customer",
              phone: reg.phone,
              token_code: reg.token_code,
              prize_won: reg.prize_won,
              registered_at: reg.registered_at ? new Date(reg.registered_at) : new Date(),
              claimed_at: reg.claimed_at ? new Date(reg.claimed_at) : undefined,
              whatsapp_link: reg.whatsapp_link,
            },
          });
        }
      }
    } catch (e) {
      console.warn("Legacy DB import note:", e);
    }
  }

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
