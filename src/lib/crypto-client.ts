/**
 * Hashes a passcode PIN on the client side using SHA-256 via Web Crypto API.
 * Returns a hex string representation of the hash.
 */
export async function hashPasscode(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
