export interface Prize {
  id: string;
  name: string;
  character: string;
  description: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  weight: number; // Secret Probability Weight
  color: string;
  textColor: string;
  icon: string;
  badge: string;
  enabled?: boolean;
}

export const INITIAL_PRIZES: Prize[] = [
  {
    id: "better-luck-next-time",
    name: "BETTER LUCK NEXT TIME 🍃",
    character: "Sakura 🌸",
    description: "Caught in a Genjutsu mist! Better luck on your next ninja scroll.",
    rarity: "Common",
    weight: 60, // MOST FREQUENT (60%)
    color: "#E91E63", // Sakura Pink
    textColor: "#FFFFFF",
    icon: "🌸",
    badge: "Sakura Blossom",
    enabled: true,
  },
  {
    id: "2-magnets-300",
    name: "2 MAGNETS FOR ₹300 🧲",
    character: "Jiraiya 🐸",
    description: "Toad Sage Special Bundle: Get 2 custom Photo Magnets for just ₹300!",
    rarity: "Rare",
    weight: 25, // SECOND MOST FREQUENT (25%)
    color: "#D32F2F", // Jiraiya Red
    textColor: "#FFFFFF",
    icon: "🐸",
    badge: "Toad Sage",
    enabled: true,
  },
  {
    id: "5-percent-off",
    name: "5% OFF",
    character: "Gaara ⏳",
    description: "Desert Sand Shield! Enjoy a 5% discount on your order!",
    rarity: "Common",
    weight: 5, // VERY RARE (5%)
    color: "#FF9800", // Sand Orange
    textColor: "#0B0D14",
    icon: "⏳",
    badge: "Sand Shinobi",
    enabled: true,
  },
  {
    id: "10-percent-off",
    name: "10% OFF",
    character: "Pain 🔴",
    description: "Almighty Push! Take 10% off your total purchase.",
    rarity: "Common",
    weight: 4, // RARE (4%)
    color: "#7B1FA2", // Akatsuki Purple
    textColor: "#FFFFFF",
    icon: "🔴",
    badge: "Almighty Push",
    enabled: true,
  },
  {
    id: "20-rupees-off",
    name: "₹20 OFF",
    character: "Rock Lee 👊",
    description: "Primary Lotus Surge! Flat ₹20 discount applied instantly!",
    rarity: "Common",
    weight: 3, // RARE (3%)
    color: "#388E3C", // Rock Lee Green
    textColor: "#FFFFFF",
    icon: "👊",
    badge: "Eight Gates",
    enabled: true,
  },
  {
    id: "friend-pays-ramen",
    name: "FRIEND PAYS FOR RAMEN 🍜",
    character: "Sasuke ⚡",
    description: "Chidori Swap! Your ninja friend pays for your Ichiraku Ramen!",
    rarity: "Epic",
    weight: 2, // ULTRA RARE (2%)
    color: "#1976D2", // Sasuke Uchiha Blue
    textColor: "#FFFFFF",
    icon: "🍜",
    badge: "Chidori Swap",
    enabled: true,
  },
  {
    id: "re-spin-chakra",
    name: "RE-SPIN CHAKRA 🌀",
    character: "Itachi 👁️",
    description: "Tsukuyomi Bonus! You earned a bonus re-spin ticket!",
    rarity: "Legendary",
    weight: 1, // BONUS RE-SPIN (1%)
    color: "#212121", // Itachi Dark Crimson
    textColor: "#FF4444",
    icon: "👁️",
    badge: "Crow Genjutsu",
    enabled: true,
  },
  {
    id: "free-photo-magnet",
    name: "FREE PHOTO MAGNET",
    character: "Naruto 🍥",
    description: "Nine-Tails Gift! Claim a complimentary custom Photo Magnet!",
    rarity: "Rare",
    weight: 0, // NEVER WINS (0%)
    color: "#FF6B00", // Naruto Orange
    textColor: "#FFFFFF",
    icon: "🍥",
    badge: "Nine-Tails",
    enabled: true,
  },
];

export function selectServerPrize(prizes: Prize[] = INITIAL_PRIZES): { prize: Prize; sliceIndex: number } {
  const activePrizes = prizes.filter((p) => p.enabled !== false && p.weight > 0);
  const pool = activePrizes.length > 0 ? activePrizes : prizes;

  const totalWeight = pool.reduce((sum, item) => sum + Math.max(0, item.weight), 0);

  if (totalWeight <= 0) {
    return { prize: prizes[0], sliceIndex: 0 };
  }

  let randomNum = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i++) {
    if (randomNum < pool[i].weight) {
      const originalIndex = prizes.findIndex((p) => p.id === pool[i].id);
      return { prize: pool[i], sliceIndex: originalIndex >= 0 ? originalIndex : i };
    }
    randomNum -= pool[i].weight;
  }

  return { prize: prizes[0], sliceIndex: 0 };
}
