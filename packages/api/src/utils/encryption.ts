import crypto from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.CERTIFICATE_ENCRYPTION_KEY;
  if (!key || key.length !== 32) {
    throw new Error(
      "CERTIFICATE_ENCRYPTION_KEY must be exactly 32 characters"
    );
  }
  return Buffer.from(key, "utf-8");
}

export function encryptBuffer(plaintext: Buffer): Buffer {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}

export function decryptBuffer(packed: Buffer): Buffer {
  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

export function encryptString(plaintext: string): string {
  return encryptBuffer(Buffer.from(plaintext, "utf-8")).toString("hex");
}

export function decryptString(hex: string): string {
  return decryptBuffer(Buffer.from(hex, "hex")).toString("utf-8");
}
