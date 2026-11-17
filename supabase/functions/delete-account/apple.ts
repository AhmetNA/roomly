// Sign in with Apple users must have their Apple tokens revoked when they delete
// their account (App Store Review Guideline 5.1.1(v)). The app re-runs Apple's
// sign-in sheet right before deletion and sends the fresh authorization code;
// it is exchanged for a refresh token here and revoked at once, so no Apple
// token is ever stored. Secrets: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY
// (the .p8 contents) and APPLE_CLIENT_ID (the iOS bundle ID).

const APPLE_AUTH = "https://appleid.apple.com";

const base64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_")
    .replace(/=+$/, "");
const encodeJson = (value: unknown) =>
  base64Url(new TextEncoder().encode(JSON.stringify(value)));

function pemToPkcs8(pem: string): ArrayBuffer {
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\\n|\s/g, "");
  return Uint8Array.from(atob(body), (char) => char.charCodeAt(0)).buffer;
}

export function appleConfig() {
  const teamId = Deno.env.get("APPLE_TEAM_ID");
  const keyId = Deno.env.get("APPLE_KEY_ID");
  const privateKey = Deno.env.get("APPLE_PRIVATE_KEY");
  const clientId = Deno.env.get("APPLE_CLIENT_ID");
  if (!teamId || !keyId || !privateKey || !clientId) return null;
  return { teamId, keyId, privateKey, clientId };
}

type AppleConfig = NonNullable<ReturnType<typeof appleConfig>>;

async function clientSecret(config: AppleConfig): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const signingInput = `${encodeJson({ alg: "ES256", kid: config.keyId })}.${
    encodeJson({
      iss: config.teamId,
      iat: now,
      exp: now + 300,
      aud: APPLE_AUTH,
      sub: config.clientId,
    })
  }`;
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(config.privateKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  // WebCrypto returns the raw r||s signature, which is exactly JWS ES256.
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${base64Url(new Uint8Array(signature))}`;
}

// Returns true only when Apple confirmed the revocation.
export async function revokeAppleAuthorization(
  authorizationCode: string,
  config: AppleConfig,
): Promise<boolean> {
  const secret = await clientSecret(config);
  const tokenResponse = await fetch(`${APPLE_AUTH}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: secret,
      code: authorizationCode,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenResponse.ok) return false;
  const tokens: unknown = await tokenResponse.json();
  const refreshToken = tokens && typeof tokens === "object" &&
      "refresh_token" in tokens && typeof tokens.refresh_token === "string"
    ? tokens.refresh_token
    : null;
  if (!refreshToken) return false;
  const revokeResponse = await fetch(`${APPLE_AUTH}/auth/revoke`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: secret,
      token: refreshToken,
      token_type_hint: "refresh_token",
    }),
  });
  return revokeResponse.ok;
}
