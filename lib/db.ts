import fs from "fs";
import path from "path";
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

interface DatabaseSchema {
  tokens: Record<string, TokenRecord>;
  logs: SpinLog[];
  prizes: Prize[];
  registrations: CustomerRegistration[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "tokens_db.json");

const DEFAULT_TOKENS: Record<string, TokenRecord> = {};

let inMemoryDb: DatabaseSchema = {
  tokens: { ...DEFAULT_TOKENS },
  logs: [],
  prizes: [...INITIAL_PRIZES],
  registrations: [],
};

function ensureDbDirectory() {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
  } catch {}
}

function readDb(): DatabaseSchema {
  try {
    ensureDbDirectory();
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(data);
      inMemoryDb = {
        tokens: parsed.tokens || DEFAULT_TOKENS,
        logs: parsed.logs || [],
        prizes: parsed.prizes || INITIAL_PRIZES,
        registrations: parsed.registrations || [],
      };
      return inMemoryDb;
    } else {
      writeDb(inMemoryDb);
      return inMemoryDb;
    }
  } catch {
    return inMemoryDb;
  }
}

function writeDb(data: DatabaseSchema): void {
  inMemoryDb = data;
  try {
    ensureDbDirectory();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}

export function registerCustomerUser(name: string, phone: string): { token: TokenRecord; registration: CustomerRegistration } {
  const db = readDb();
  const cleanPhone = phone.trim().replace(/\D/g, "");
  const randomCode = `NINJA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const tokenObj: TokenRecord = {
    code: randomCode,
    is_used: false,
    created_at: new Date().toISOString(),
    customer_name: name.trim(),
    phone: cleanPhone,
    note: `Registered User: ${name.trim()}`,
  };

  const regObj: CustomerRegistration = {
    id: Math.random().toString(36).substring(2, 9),
    name: name.trim(),
    phone: cleanPhone,
    token_code: randomCode,
    registered_at: new Date().toISOString(),
  };

  db.tokens[randomCode] = tokenObj;
  db.registrations.unshift(regObj);

  addLog({
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    token: randomCode,
    action: "REGISTERED",
    phone: cleanPhone,
  });

  writeDb(db);
  return { token: tokenObj, registration: regObj };
}

export function createToken(code: string, note?: string): TokenRecord {
  const db = readDb();
  const normalized = code.trim().toUpperCase();

  if (db.tokens[normalized]) {
    return db.tokens[normalized];
  }

  const newToken: TokenRecord = {
    code: normalized,
    is_used: false,
    created_at: new Date().toISOString(),
    note: note || "Generated Shinobi Token",
  };

  db.tokens[normalized] = newToken;
  writeDb(db);
  return newToken;
}

export function generateTokenBatch(count: number, prefix: string = "NINJA"): TokenRecord[] {
  const db = readDb();
  const created: TokenRecord[] = [];

  for (let i = 0; i < count; i++) {
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const code = `${prefix}-${randomSuffix}`;
    if (!db.tokens[code]) {
      const tokenObj: TokenRecord = {
        code,
        is_used: false,
        created_at: new Date().toISOString(),
        note: `Batch Ticket #${i + 1}`,
      };
      db.tokens[code] = tokenObj;
      created.push(tokenObj);
    }
  }

  writeDb(db);
  return created;
}

export function getAllTokens(): TokenRecord[] {
  const db = readDb();
  return Object.values(db.tokens);
}

export function getToken(code: string): TokenRecord | undefined {
  const db = readDb();
  const normalized = code.trim().toUpperCase();
  return db.tokens[normalized];
}

export function claimToken(
  code: string,
  prize: Prize,
  sliceIndex: number,
  ip: string = "unknown",
  userAgent: string = "unknown",
  phone?: string,
  name?: string
): { success: boolean; token?: TokenRecord; error?: string; registration?: CustomerRegistration; whatsappLink?: string } {
  const db = readDb();
  const normalized = code.trim().toUpperCase();
  let token = db.tokens[normalized];

  if (!token) {
    // Create dynamically for signed serverless tokens
    token = {
      code: normalized,
      is_used: false,
      created_at: new Date().toISOString(),
      customer_name: name,
      phone: phone,
    };
  }

  if (token.is_used) {
    addLog({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      token: code,
      action: "REJECTED_ALREADY_CLAIMED",
      prize_won: token.prize_won?.name,
      ip,
    });
    return { success: false, token, error: "You have already used your spin access!" };
  }

  token.is_used = true;
  token.claimed_at = new Date().toISOString();
  token.prize_won = prize;
  token.slice_index = sliceIndex;
  token.ip = ip;
  token.user_agent = userAgent;
  if (phone) token.phone = phone;
  if (name) token.customer_name = name;

  db.tokens[normalized] = token;

  let waLink = "";
  if (token.phone) {
    waLink = generateWhatsAppLink(token.phone, prize.name, token.customer_name);
  }

  const regIndex = db.registrations.findIndex((r) => r.token_code === normalized);
  if (regIndex >= 0) {
    db.registrations[regIndex].prize_won = prize.name;
    db.registrations[regIndex].claimed_at = token.claimed_at;
    db.registrations[regIndex].whatsapp_link = waLink;
  } else if (phone) {
    db.registrations.unshift({
      id: Math.random().toString(36).substring(2, 9),
      name: name || "Shinobi Customer",
      phone,
      token_code: normalized,
      prize_won: prize.name,
      registered_at: new Date().toISOString(),
      claimed_at: token.claimed_at,
      whatsapp_link: waLink,
    });
  }

  addLog({
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    token: code,
    action: "SPUN",
    prize_won: prize.name,
    ip,
    phone: token.phone,
  });

  writeDb(db);
  return {
    success: true,
    token,
    whatsappLink: waLink,
  };
}

export function resetToken(code: string): boolean {
  const db = readDb();
  const normalized = code.trim().toUpperCase();
  if (db.tokens[normalized]) {
    db.tokens[normalized].is_used = false;
    delete db.tokens[normalized].claimed_at;
    delete db.tokens[normalized].prize_won;
    delete db.tokens[normalized].slice_index;
    writeDb(db);
    return true;
  }
  return false;
}

export function getDbPrizes(): Prize[] {
  const db = readDb();
  return db.prizes && db.prizes.length > 0 ? db.prizes : INITIAL_PRIZES;
}

export function updateDbPrizes(prizes: Prize[]): boolean {
  const db = readDb();
  db.prizes = prizes;
  writeDb(db);
  return true;
}

export function getAllRegistrations(): CustomerRegistration[] {
  const db = readDb();
  return db.registrations || [];
}

function addLog(log: SpinLog) {
  const db = readDb();
  db.logs.unshift(log);
  if (db.logs.length > 500) {
    db.logs = db.logs.slice(0, 500);
  }
  writeDb(db);
}

export function getLogs(): SpinLog[] {
  const db = readDb();
  return db.logs;
}
