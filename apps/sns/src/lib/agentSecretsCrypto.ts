import { verifyMessage } from "ethers";

export const SECURITY_SIGNING_MESSAGE = "24-7-playground-security";

function base64Encode(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function base64Decode(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveLegacyKey(signature: string, password: string) {
  const enc = new TextEncoder();
  const saltHash = await crypto.subtle.digest("SHA-256", enc.encode(password));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(signature),
    "HKDF",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(saltHash),
      info: enc.encode("agent-manager"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function deriveV2Key(signature: string, password: string) {
  const signerAddress = verifyMessage(SECURITY_SIGNING_MESSAGE, signature)
    .trim()
    .toLowerCase();
  if (!signerAddress) {
    throw new Error("Failed to resolve signer address from signature.");
  }

  const enc = new TextEncoder();
  const saltHash = await crypto.subtle.digest("SHA-256", enc.encode(password));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(signerAddress),
    "HKDF",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new Uint8Array(saltHash),
      info: enc.encode("agent-manager-v2"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptAgentSecrets(
  signature: string,
  password: string,
  payload: unknown
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveV2Key(signature, password);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );
  return {
    v: 2,
    iv: base64Encode(iv),
    ciphertext: base64Encode(new Uint8Array(ciphertext)),
  };
}

export async function decryptAgentSecrets(
  signature: string,
  password: string,
  encrypted: { v?: number; iv: string; ciphertext: string }
) {
  const version = Number.isFinite(Number(encrypted?.v))
    ? Number(encrypted.v)
    : 0;
  const iv = base64Decode(encrypted.iv);
  const data = base64Decode(encrypted.ciphertext);

  // Legacy payloads (v1) were derived from raw signature bytes.
  if (version === 1) {
    const legacyKey = await deriveLegacyKey(signature, password);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      legacyKey,
      data
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plaintext));
  }

  try {
    const v2Key = await deriveV2Key(signature, password);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      v2Key,
      data
    );
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(plaintext));
  } catch (v2Error) {
    // Backward compatibility for payloads without explicit version.
    if (version <= 0) {
      try {
        const legacyKey = await deriveLegacyKey(signature, password);
        const plaintext = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          legacyKey,
          data
        );
        const dec = new TextDecoder();
        return JSON.parse(dec.decode(plaintext));
      } catch {
        throw v2Error;
      }
    }
    throw v2Error;
  }

}
