import { createHash, randomBytes } from "node:crypto";

export function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createAccessToken() {
  const plain = `os_${randomBytes(30).toString("base64url")}`;
  return { plain, hash: hashAccessToken(plain), prefix: plain.slice(0, 10) };
}
