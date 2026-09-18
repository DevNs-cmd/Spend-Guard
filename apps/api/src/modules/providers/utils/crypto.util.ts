import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// AES-256-GCM encryption for provider credentials at rest.
// PROVIDER_KEY_ENCRYPTION_SECRET must be a stable, secret passphrase set in .env
// — changing it after data is encrypted will make existing rows undecryptable,
// so treat it like any other production secret (never commit it, never rotate
// casually without a re-encryption migration).

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // recommended IV length for GCM
const SALT = "spendguard-provider-credentials"; // fixed salt for key derivation

function getKey(): Buffer {
  const secret = process.env.PROVIDER_KEY_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error(
      "PROVIDER_KEY_ENCRYPTION_SECRET is not set. Refusing to encrypt/decrypt provider credentials.",
    );
  }
  // Derive a 32-byte key from the passphrase so any secret length works.
  return scryptSync(secret, SALT, 32);
}

/**
 * Encrypts a plaintext string (an API key, or a JSON-stringified credentials
 * object for providers like Gemini that need more than a single key).
 * Output format: base64(iv):base64(authTag):base64(ciphertext)
 */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), encrypted.toString("base64")].join(
    ":",
  );
}

/**
 * Decrypts a string produced by encryptSecret(). Throws if the payload is
 * malformed or the auth tag doesn't match (tampering or wrong key).
 */
export function decryptSecret(payload: string): string {
  const key = getKey();
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted payload");
  }
  const [ivB64, authTagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const data = Buffer.from(dataB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString("utf8");
}
