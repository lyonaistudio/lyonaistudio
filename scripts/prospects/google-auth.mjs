// Authentification Google via compte de service — aucune dépendance npm,
// juste node:crypto (signature JWT RS256) + fetch natif (échange de token).
import { readFileSync } from "node:fs";
import { createSign } from "node:crypto";

const b64url = (buf) =>
  Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

export function loadServiceAccount(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

export async function getAccessToken(serviceAccount, scope = "https://www.googleapis.com/auth/spreadsheets") {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: serviceAccount.client_email,
    scope,
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(claims))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = b64url(signer.sign(serviceAccount.private_key));
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(serviceAccount.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`Echec obtention token: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}
