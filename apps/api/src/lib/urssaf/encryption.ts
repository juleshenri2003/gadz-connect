import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getUrssafApiConfig } from "./config.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer {
  const config = getUrssafApiConfig();
  const hex = config.encryptionKey;
  if (hex && hex.length === 64) {
    return Buffer.from(hex, "hex");
  }
  if (config.mock) {
    return Buffer.from(
      "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
      "hex",
    );
  }
  throw new Error(
    "URSSAF_ENCRYPTION_KEY invalide — générez une clé : openssl rand -hex 32",
  );
}

/** Chiffre une valeur sensible (IBAN, NIR) pour stockage au repos. */
export function encryptSensitiveValue(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    tag.toString("base64"),
    encrypted.toString("base64"),
  ].join(":");
}

/** Déchiffre une valeur stockée via `encryptSensitiveValue`. */
export function decryptSensitiveValue(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":");
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Format de données chiffrées invalide");
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/** Masque un IBAN pour affichage (FR76 **** **** **** 1234). */
export function maskIban(iban: string): string {
  const normalized = iban.replace(/\s/g, "").toUpperCase();
  if (normalized.length < 8) return "****";
  return `${normalized.slice(0, 4)} **** **** ${normalized.slice(-4)}`;
}
