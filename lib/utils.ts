export function generateWhatsAppLink(phone: string, prizeName: string, customerName?: string): string {
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const nameGreeting = customerName ? ` ${customerName}` : "";

  const text = `Arigato${nameGreeting}! 🍃 Thank you for buying our product! Your Shinobi Spin Reward: *${prizeName}*. Show this scroll to redeem your offer. Arigato! 🍥`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Validates 10-digit mobile phone numbers.
 * Rejects dummy numbers like 0000000000, 1111111111, 1234567890, or non-Indian prefix numbers.
 */
export function validateMobileNumber(phone: string): { valid: boolean; cleanPhone: string; error?: string } {
  let clean = phone.trim().replace(/\D/g, "");

  // Handle leading country code 91 or leading 0
  if (clean.length === 12 && clean.startsWith("91")) {
    clean = clean.slice(2);
  } else if (clean.length === 11 && clean.startsWith("0")) {
    clean = clean.slice(1);
  }

  if (clean.length !== 10) {
    return { valid: false, cleanPhone: clean, error: "Please enter a valid 10-digit mobile phone number." };
  }

  // Must start with 6, 7, 8, or 9
  if (!/^[6-9]\d{9}$/.test(clean)) {
    return {
      valid: false,
      cleanPhone: clean,
      error: "Mobile number must start with 6, 7, 8, or 9 (e.g. 9876543210).",
    };
  }

  // Reject repeating numbers (e.g., 0000000000, 1111111111, 9999999999)
  if (/^(\d)\1{9}$/.test(clean)) {
    return {
      valid: false,
      cleanPhone: clean,
      error: "Dummy repeating phone numbers (like 0000000000) are not allowed.",
    };
  }

  // Reject sequential dummy numbers
  const sequentialDummies = ["1234567890", "0123456789", "9876543210", "0987654321"];
  if (sequentialDummies.includes(clean)) {
    return {
      valid: false,
      cleanPhone: clean,
      error: "Please enter your real 10-digit personal phone number.",
    };
  }

  return { valid: true, cleanPhone: clean };
}
