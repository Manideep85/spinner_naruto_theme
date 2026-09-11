import { prisma } from "./prisma";
import { Prize, INITIAL_PRIZES } from "./prizes";
import { generateWhatsAppLink } from "./utils";

export interface TokenRecord {
  code: string;
  is_used: boolean;
  created_at: string;
  claimed_at?: string;
  prize_won?: Prize;
  slice_index?: number;
  ip?: string;
  user_agent?: string;
  phone?: string;
  customer_name?: string;
  note?: string;
}

export interface SpinLog {
  id: string;
  timestamp: string;
  token: string;
  action: "REGISTERED" | "SPUN" | "REJECTED_ALREADY_CLAIMED" | "INVALID_TOKEN";
  prize_won?: string;
  ip?: string;
  phone?: string;
}

export interface CustomerRegistration {
  id: string;
  name: string;
  phone: string;
  token_code: string;
  prize_won?: string;
  registered_at: string;
  claimed_at?: string;
  whatsapp_link?: string;
}

/**
 * Check if a 10-digit phone number has ALREADY registered or used a spin.
 * Queries CustomerRegistration and TokenRecord in Prisma relational DB.
 */
export async function isPhoneAlreadyUsed(phone: string): Promise<{ is_used: boolean; prize_won?: string; claimed_at?: string; token_code?: string }> {
  const digits = phone.trim().replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  if (!last10) return { is_used: false };

  try {
    const reg = await prisma.customerRegistration.findFirst({
      where: {
        phone: {
          endsWith: last10,
        },
      },
    });

    if (reg) {
      return {
        is_used: true,
        prize_won: reg.prize_won || "Registration Recorded",
        claimed_at: reg.claimed_at ? reg.claimed_at.toISOString() : reg.registered_at.toISOString(),
        token_code: reg.token_code,
      };
    }

    const token = await prisma.tokenRecord.findFirst({
      where: {
        phone: {
          endsWith: last10,
        },
      },
    });

    if (token) {
      let prizeObj: Prize | undefined = undefined;
      if (token.prize_won_json) {
        try {
          prizeObj = JSON.parse(token.prize_won_json);
        } catch {}
      }

      return {
        is_used: true,
        prize_won: prizeObj?.name || "Registration Recorded",
        claimed_at: token.claimed_at ? token.claimed_at.toISOString() : token.created_at.toISOString(),
        token_code: token.code,
      };
    }

    return { is_used: false };
  } catch (error) {
    console.error("isPhoneAlreadyUsed DB error:", error);
    return { is_used: false };
  }
}

/**
 * Atomic customer registration in Prisma database.
 */
export async function registerCustomerUser(
  name: string,
  phone: string
): Promise<{ success: boolean; token?: TokenRecord; registration?: CustomerRegistration; is_used?: boolean; prize_won?: string; claimed_at?: string; error?: string }> {
  const cleanPhone = phone.trim().replace(/\D/g, "");

  const phoneCheck = await isPhoneAlreadyUsed(cleanPhone);
  if (phoneCheck.is_used) {
    return {
      success: false,
      is_used: true,
      prize_won: phoneCheck.prize_won,
      claimed_at: phoneCheck.claimed_at,
      error: "This phone number has already been registered and used its single-use spin!",
    };
  }

  const randomCode = `NINJA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tokenRec = await tx.tokenRecord.create({
        data: {
          code: randomCode,
          is_used: false,
          created_at: new Date(),
          customer_name: name.trim(),
          phone: cleanPhone,
          note: `Registered User: ${name.trim()}`,
        },
      });

      const regRec = await tx.customerRegistration.create({
        data: {
          id: Math.random().toString(36).substring(2, 9),
          name: name.trim(),
          phone: cleanPhone,
          token_code: randomCode,
          registered_at: new Date(),
        },
      });

      await tx.spinLog.create({
        data: {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
          token: randomCode,
          action: "REGISTERED",
          phone: cleanPhone,
        },
      });

      return { tokenRec, regRec };
    });

    const tokenObj: TokenRecord = {
      code: result.tokenRec.code,
      is_used: result.tokenRec.is_used,
      created_at: result.tokenRec.created_at.toISOString(),
      customer_name: result.tokenRec.customer_name || undefined,
      phone: result.tokenRec.phone || undefined,
    };

    const regObj: CustomerRegistration = {
      id: result.regRec.id,
      name: result.regRec.name,
      phone: result.regRec.phone,
      token_code: result.regRec.token_code,
      registered_at: result.regRec.registered_at.toISOString(),
    };

    return { success: true, token: tokenObj, registration: regObj };
  } catch (error) {
    console.error("registerCustomerUser DB error:", error);
    return { success: false, error: "Database error registering customer." };
  }
}

export async function createToken(code: string, note?: string): Promise<TokenRecord> {
  const normalized = code.trim().toUpperCase();

  try {
    const existing = await prisma.tokenRecord.findUnique({
      where: { code: normalized },
    });

    if (existing) {
      return {
        code: existing.code,
        is_used: existing.is_used,
        created_at: existing.created_at.toISOString(),
        claimed_at: existing.claimed_at?.toISOString(),
        note: existing.note || undefined,
      };
    }

    const created = await prisma.tokenRecord.create({
      data: {
        code: normalized,
        is_used: false,
        created_at: new Date(),
        note: note || "Generated Shinobi Token",
      },
    });

    return {
      code: created.code,
      is_used: created.is_used,
      created_at: created.created_at.toISOString(),
      note: created.note || undefined,
    };
  } catch (error) {
    console.error("createToken error:", error);
    return {
      code: normalized,
      is_used: false,
      created_at: new Date().toISOString(),
    };
  }
}

export async function generateTokenBatch(count: number, prefix: string = "NINJA"): Promise<TokenRecord[]> {
  const createdList: TokenRecord[] = [];

  for (let i = 0; i < count; i++) {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `${prefix}-${randomSuffix}`;
    const token = await createToken(code, `Batch Ticket #${i + 1}`);
    createdList.push(token);
  }

  return createdList;
}

export async function getAllTokens(): Promise<TokenRecord[]> {
  try {
    const tokens = await prisma.tokenRecord.findMany({
      orderBy: { created_at: "desc" },
    });

    return tokens.map((t) => {
      let prizeWon: Prize | undefined = undefined;
      if (t.prize_won_json) {
        try {
          prizeWon = JSON.parse(t.prize_won_json);
        } catch {}
      }

      return {
        code: t.code,
        is_used: t.is_used,
        created_at: t.created_at.toISOString(),
        claimed_at: t.claimed_at?.toISOString(),
        prize_won: prizeWon,
        slice_index: t.slice_index || undefined,
        ip: t.ip || undefined,
        user_agent: t.user_agent || undefined,
        phone: t.phone || undefined,
        customer_name: t.customer_name || undefined,
        note: t.note || undefined,
      };
    });
  } catch (error) {
    console.error("getAllTokens error:", error);
    return [];
  }
}

export async function getToken(code: string): Promise<TokenRecord | undefined> {
  const normalized = code.trim().toUpperCase();
  try {
    const t = await prisma.tokenRecord.findUnique({
      where: { code: normalized },
    });

    if (!t) return undefined;

    let prizeWon: Prize | undefined = undefined;
    if (t.prize_won_json) {
      try {
        prizeWon = JSON.parse(t.prize_won_json);
      } catch {}
    }

    return {
      code: t.code,
      is_used: t.is_used,
      created_at: t.created_at.toISOString(),
      claimed_at: t.claimed_at?.toISOString(),
      prize_won: prizeWon,
      slice_index: t.slice_index !== null ? t.slice_index : undefined,
      ip: t.ip || undefined,
      user_agent: t.user_agent || undefined,
      phone: t.phone || undefined,
      customer_name: t.customer_name || undefined,
      note: t.note || undefined,
    };
  } catch (error) {
    console.error("getToken DB error:", error);
    return undefined;
  }
}

export async function claimToken(
  code: string,
  prize: Prize,
  sliceIndex: number,
  ip: string = "unknown",
  userAgent: string = "unknown",
  phone?: string,
  name?: string
): Promise<{ success: boolean; token?: TokenRecord; error?: string; registration?: CustomerRegistration; whatsappLink?: string }> {
  const normalized = code.trim().toUpperCase();

  try {
    const existing = await getToken(normalized);

    if (existing && existing.is_used) {
      await addLog({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        token: code,
        action: "REJECTED_ALREADY_CLAIMED",
        prize_won: existing.prize_won?.name,
        ip,
      });

      return { success: false, token: existing, error: "You have already used your spin access!" };
    }

    const now = new Date();
    const prizeJson = JSON.stringify(prize);

    const updatedToken = await prisma.tokenRecord.upsert({
      where: { code: normalized },
      update: {
        is_used: true,
        claimed_at: now,
        prize_won_json: prizeJson,
        slice_index: sliceIndex,
        ip,
        user_agent: userAgent,
        phone: phone || undefined,
        customer_name: name || undefined,
      },
      create: {
        code: normalized,
        is_used: true,
        created_at: now,
        claimed_at: now,
        prize_won_json: prizeJson,
        slice_index: sliceIndex,
        ip,
        user_agent: userAgent,
        phone: phone || undefined,
        customer_name: name || undefined,
      },
    });

    let waLink = "";
    if (phone) {
      waLink = generateWhatsAppLink(phone, prize.name, name || updatedToken.customer_name || undefined);
    }

    // Update CustomerRegistration record if present
    const regRecord = await prisma.customerRegistration.findFirst({
      where: {
        OR: [{ token_code: normalized }, { phone: phone || "NONE" }],
      },
    });

    if (regRecord) {
      await prisma.customerRegistration.update({
        where: { id: regRecord.id },
        data: {
          prize_won: prize.name,
          claimed_at: now,
          whatsapp_link: waLink || undefined,
        },
      });
    } else if (phone) {
      await prisma.customerRegistration.create({
        data: {
          id: Math.random().toString(36).substring(2, 9),
          name: name || "Shinobi Customer",
          phone,
          token_code: normalized,
          prize_won: prize.name,
          registered_at: now,
          claimed_at: now,
          whatsapp_link: waLink || undefined,
        },
      });
    }

    await addLog({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: now.toISOString(),
      token: code,
      action: "SPUN",
      prize_won: prize.name,
      ip,
      phone: phone || updatedToken.phone || undefined,
    });

    const tokenResult: TokenRecord = {
      code: updatedToken.code,
      is_used: updatedToken.is_used,
      created_at: updatedToken.created_at.toISOString(),
      claimed_at: updatedToken.claimed_at?.toISOString(),
      prize_won: prize,
      slice_index: sliceIndex,
      ip,
      user_agent: userAgent,
      phone: updatedToken.phone || undefined,
      customer_name: updatedToken.customer_name || undefined,
    };

    return {
      success: true,
      token: tokenResult,
      whatsappLink: waLink,
    };
  } catch (error) {
    console.error("claimToken DB error:", error);
    return { success: false, error: "Database error claiming token." };
  }
}

export async function resetToken(code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  try {
    await prisma.tokenRecord.update({
      where: { code: normalized },
      data: {
        is_used: false,
        claimed_at: null,
        prize_won_json: null,
        slice_index: null,
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function getDbPrizes(): Promise<Prize[]> {
  try {
    const dbPrizes = await prisma.prizeRecord.findMany({
      where: { enabled: true },
      orderBy: { order_index: "asc" },
    });

    if (!dbPrizes || dbPrizes.length === 0) {
      return INITIAL_PRIZES;
    }

    return dbPrizes.map((p) => ({
      id: p.id,
      name: p.name,
      character: p.character,
      description: p.description,
      rarity: p.rarity as any,
      weight: p.weight,
      color: p.color,
      textColor: p.textColor,
      icon: p.icon,
      badge: p.badge,
      enabled: p.enabled,
    }));
  } catch (error) {
    console.error("getDbPrizes DB error:", error);
    return INITIAL_PRIZES;
  }
}

export async function updateDbPrizes(prizes: Prize[]): Promise<boolean> {
  try {
    for (let i = 0; i < prizes.length; i++) {
      const p = prizes[i];
      await prisma.prizeRecord.upsert({
        where: { id: p.id },
        update: {
          weight: Math.max(0, p.weight),
          enabled: p.enabled !== false,
          order_index: i,
        },
        create: {
          id: p.id,
          name: p.name,
          character: p.character,
          description: p.description,
          rarity: p.rarity,
          weight: Math.max(0, p.weight),
          color: p.color,
          textColor: p.textColor,
          icon: p.icon || "",
          badge: p.badge,
          enabled: p.enabled !== false,
          order_index: i,
        },
      });
    }
    return true;
  } catch (error) {
    console.error("updateDbPrizes DB error:", error);
    return false;
  }
}

export async function getAllRegistrations(): Promise<CustomerRegistration[]> {
  try {
    const regs = await prisma.customerRegistration.findMany({
      orderBy: { registered_at: "desc" },
    });

    return regs.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      token_code: r.token_code,
      prize_won: r.prize_won || undefined,
      registered_at: r.registered_at.toISOString(),
      claimed_at: r.claimed_at?.toISOString(),
      whatsapp_link: r.whatsapp_link || undefined,
    }));
  } catch (error) {
    console.error("getAllRegistrations DB error:", error);
    return [];
  }
}

export async function deleteRegistration(id: string): Promise<boolean> {
  try {
    const reg = await prisma.customerRegistration.findUnique({
      where: { id },
    });

    if (!reg) return false;

    await prisma.customerRegistration.delete({
      where: { id },
    });

    if (reg.token_code) {
      try {
        await prisma.tokenRecord.delete({
          where: { code: reg.token_code },
        });
      } catch {}
    }

    if (reg.phone) {
      const cleanDigits = reg.phone.replace(/\D/g, "");
      const last10 = cleanDigits.length >= 10 ? cleanDigits.slice(-10) : cleanDigits;

      try {
        await prisma.tokenRecord.deleteMany({
          where: {
            phone: {
              endsWith: last10,
            },
          },
        });
      } catch {}
    }

    return true;
  } catch (error) {
    console.error("deleteRegistration DB error:", error);
    return false;
  }
}

export async function addLog(log: SpinLog): Promise<void> {
  try {
    await prisma.spinLog.create({
      data: {
        id: log.id || Math.random().toString(36).substring(2, 9),
        timestamp: new Date(log.timestamp),
        token: log.token,
        action: log.action,
        prize_won: log.prize_won || undefined,
        ip: log.ip || undefined,
        phone: log.phone || undefined,
      },
    });
  } catch (error) {
    console.error("addLog DB error:", error);
  }
}

export async function getLogs(): Promise<SpinLog[]> {
  try {
    const logs = await prisma.spinLog.findMany({
      orderBy: { timestamp: "desc" },
      take: 500,
    });

    return logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString(),
      token: l.token,
      action: l.action as any,
      prize_won: l.prize_won || undefined,
      ip: l.ip || undefined,
      phone: l.phone || undefined,
    }));
  } catch (error) {
    console.error("getLogs DB error:", error);
    return [];
  }
}
