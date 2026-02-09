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

async function deriveKey(signature: string, password: string) {
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

export async function encryptSecrets(
  signature: string,
  password: string,
  payload: unknown
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(signature, password);
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );
  return {
    v: 1,
    iv: base64Encode(iv),
    ciphertext: base64Encode(new Uint8Array(ciphertext)),
  };
}

export async function decryptSecrets(
  signature: string,
  password: string,
  encrypted: { iv: string; ciphertext: string }
) {
  const key = await deriveKey(signature, password);
  const iv = base64Decode(encrypted.iv);
  const data = base64Decode(encrypted.ciphertext);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  const dec = new TextDecoder();
  return JSON.parse(dec.decode(plaintext));
}
