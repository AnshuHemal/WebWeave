/**
 * AES-256-GCM encryption/decryption utility for credential data.
 *
 * Uses Node.js built-in `crypto` — no external dependencies needed.
 * The secret key is derived from the CREDENTIALS_SECRET env var using
 * SHA-256 so any length of string produces a valid 32-byte key.
 *
 * Encrypted format (all hex): `<iv>:<authTag>:<ciphertext>`
 */

import crypto from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16 // bytes

function getKey(): Buffer {
  const secret = process.env.CREDENTIALS_SECRET
  if (!secret) {
    throw new Error(
      "CREDENTIALS_SECRET env var is not set. " +
        "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    )
  }
  // Derive a 32-byte key deterministically from the secret
  return crypto.createHash("sha256").update(secret).digest()
}

/**
 * Encrypts a JSON-serializable value.
 * Returns a string in the format: `iv:authTag:ciphertext` (all hex-encoded).
 */
export function encrypt(data: unknown): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const plaintext = JSON.stringify(data)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return [
    iv.toString("hex"),
    authTag.toString("hex"),
    encrypted.toString("hex"),
  ].join(":")
}

/**
 * Decrypts a string produced by `encrypt`.
 * Returns the original value deserialized from JSON.
 */
export function decrypt<T = unknown>(encryptedString: string): T {
  const key = getKey()
  const parts = encryptedString.split(":")

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted credential format")
  }

  const [ivHex, authTagHex, ciphertextHex] = parts
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const ciphertext = Buffer.from(ciphertextHex, "hex")

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return JSON.parse(decrypted.toString("utf8")) as T
}
