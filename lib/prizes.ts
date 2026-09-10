export interface Prize {
  id: string;
  name: string;
  description: string;
  rarity: "Common" | "Rare" | "Epic" | "Legendary";
  weight: number;
  color: string;
  textColor: string;
  icon: string;
  badge: string;
  enabled?: boolean;
}

export const INITIAL_PRIZES: Prize[] = [
  {
    id: "5-percent-off",
    name: "5% OFF",
    description: "Enjoy a 5% discount on your ninja purchase!",
    rarity: "Common",
    weight: 25,
    color: "#FF6B00",
    textColor: "#FFFFFF",
    icon: "🏷️",
    badge: "Chakra Discount",
    enabled: true,
  },
  {
    id: "10-percent-off",
    name: "10% OFF",
    description: "Chakra boost! Take 10% off your total order.",
    rarity: "Common",
    weight: 20,
    color: "#E60000",
    textColor: "#FFFFFF",
    icon: "📜",
    badge: "Ninja Scroll Saver",
    enabled: true,
  },
  {
    id: "20-rupees-off",
    name: "₹20 OFF",
    description: "Flat ₹20 discount applied to your order instantly!",
    rarity: "Common",
    weight: 15,
    color: "#00F0FF",
    textColor: "#0B0D14",
    icon: "💰",
    badge: "Ichiraku Coin",
    enabled: true,
  },
  {
    id: "free-photo-magnet",
    name: "FREE PHOTO MAGNET",
    description: "Claim a complimentary custom Kakashi Shinobi Photo Magnet!",
    rarity: "Rare",
    weight: 12,
    color: "#FFD700",
    textColor: "#3A2818",
    icon: "🖼️",
    badge: "Kakashi Magnet",
    enabled: true,
  },
  {
    id: "better-luck-next-time",
    name: "BETTER LUCK NEXT TIME 🍃",
    description: "Caught in a Genjutsu mist! Better luck on your next ninja scroll.",
    rarity: "Common",
    weight: 10,
    color: "#4A5568",
    textColor: "#FFFFFF",
    icon: "🍃",
    badge: "Leaf Miss",
    enabled: true,
  },
  {
    id: "friend-pays-ramen",
    name: "FRIEND PAYS FOR RAMEN 🍜",
    description: "Shadow Clone Jutsu! Your ninja friend pays for your Ichiraku Ramen!",
    rarity: "Epic",
    weight: 8,
    color: "#9900FF",
    textColor: "#FFFFFF",
    icon: "🍜",
    badge: "Ramen Swap",
    enabled: true,
  },
  {
    id: "2-magnets-300",
    name: "2 MAGNETS FOR ₹300 🧲",
    description: "Special Shinobi Bundle: Get 2 custom Photo Magnets for just ₹300!",
    rarity: "Rare",
    weight: 7,
    color: "#00E676",
    textColor: "#0B0D14",
    icon: "🧲",
    badge: "Double Magnet Deal",
    enabled: true,
  },
  {
    id: "re-spin-chakra",
    name: "RE-SPIN CHAKRA 🌀",
    description: "Nine-Tails Chakra Surge! You earned a bonus re-spin ticket!",
    rarity: "Legendary",
    weight: 3,
    color: "#FF1744",
    textColor: "#FFFFFF",
    icon: "🌀",
    badge: "Bonus Spin",
    enabled: true,
  },
];

export function selectServerPrize(prizes: Prize[] = INITIAL_PRIZES): { prize: Prize; sliceIndex: number } {
  const activePrizes = prizes.filter((p) => p.enabled !== false);
  const pool = activePrizes.length > 0 ? activePrizes : prizes;

  const totalWeight = pool.reduce((sum, item) => sum + Math.max(0, item.weight), 0);

  if (totalWeight <= 0) {
    return { prize: pool[0], sliceIndex: 0 };
  }

  let randomNum = Math.random() * totalWeight;

  for (let i = 0; i < pool.length; i++) {
    if (randomNum < pool[i].weight) {
      const originalIndex = prizes.findIndex((p) => p.id === pool[i].id);
      return { prize: pool[i], sliceIndex: originalIndex >= 0 ? originalIndex : i };
    }
    randomNum -= pool[i].weight;
  }

  return { prize: pool[0], sliceIndex: 0 };
}
