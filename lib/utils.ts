export function generateWhatsAppLink(phone: string, prizeName: string, customerName?: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const nameGreeting = customerName ? ` ${customerName}` : "";

  const text = `Arigato${nameGreeting}! 🍃 Thank you for buying our product! Your Shinobi Spin Reward: *${prizeName}*. Show this scroll to redeem your offer. Arigato! 🍥`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}
