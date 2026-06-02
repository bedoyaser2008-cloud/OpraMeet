import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const FALLBACK_SECRET = "default-secret-at-least-32-chars-long";

/**
 * Returns the encryption secret key, enforcing its presence in production environments at runtime.
 */
function getSecretKey(): string {
  const secret = process.env.DATABASE_ENCRYPTION_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL SECURITY ERROR: DATABASE_ENCRYPTION_SECRET environment variable is not configured in production!");
    }
    return FALLBACK_SECRET;
  }
  return secret;
}

/**
 * Encrypts a JSON-serializable payload using AES-256-GCM and PBKDF2 key derivation.
 * Output format: enc::saltHex|ivHex|authTagHex|iterations|ciphertextHex
 */
export function encryptPayload(data: any): string {
  const payloadStr = JSON.stringify(data);
  const salt = crypto.randomBytes(64);
  const iv = crypto.randomBytes(12);
  
  // Random iterations between 10000 and 99000
  const iterations = Math.floor(Math.random() * (99000 - 10000 + 1)) + 10000;
  
  // Derive key from the secret key and the random salt
  const key = crypto.pbkdf2Sync(getSecretKey(), salt, iterations, 32, "sha256");
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let ciphertext = cipher.update(payloadStr, "utf8", "hex");
  ciphertext += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  const saltHex = salt.toString("hex");
  const ivHex = iv.toString("hex");
  const iterationsStr = iterations.toString();
  
  return `enc::${saltHex}|${ivHex}|${authTag}|${iterationsStr}|${ciphertext}`;
}

/**
 * Decrypts a payload encrypted by encryptPayload.
 */
export function decryptPayload<T>(encryptedString: string): T {
  if (!encryptedString.startsWith("enc::")) {
    throw new Error("Invalid encrypted string format");
  }
  
  const parts = encryptedString.substring(5).split("|");
  if (parts.length !== 5) {
    throw new Error("Invalid encrypted payload structure");
  }
  
  const [saltHex, ivHex, authTagHex, iterationsStr, ciphertextHex] = parts;
  
  const salt = Buffer.from(saltHex, "hex");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const iterations = parseInt(iterationsStr, 10);
  
  if (isNaN(iterations)) {
    throw new Error("Invalid iterations count in encrypted string");
  }
  
  const key = crypto.pbkdf2Sync(getSecretKey(), salt, iterations, 32, "sha256");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(ciphertextHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return JSON.parse(decrypted) as T;
}
