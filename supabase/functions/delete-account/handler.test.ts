import { handleDeleteAccount } from "./handler.ts";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const request = (
  body: unknown,
  authorization = "Bearer fixture-access-token",
) =>
  new Request("https://fixture.invalid/delete-account", {
    method: "POST",
    headers: { authorization, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

Deno.test("rejects methods, missing auth and caller-supplied user IDs", async () => {
  assert(
    (await handleDeleteAccount(new Request("https://fixture.invalid")))
      .status === 405,
    "method",
  );
  assert(
    (await handleDeleteAccount(request({ confirmation: "DELETE" }, "")))
      .status === 401,
    "auth",
  );
  assert(
    (await handleDeleteAccount(
      request({ confirmation: "DELETE", user_id: "someone-else" }),
    )).status === 400,
    "target injection",
  );
  assert(
    (await handleDeleteAccount(request({ confirmation: "delete" }))).status ===
      400,
    "confirmation",
  );
});

Deno.test("uses validated account ID, cleans Storage before finalization, supports retry", async () => {
  const originalFetch = globalThis.fetch;
  const oldUrl = Deno.env.get("SUPABASE_URL");
  const oldKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  Deno.env.set("SUPABASE_URL", "https://fixture.invalid");
  Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "fixture-server-only-key");
  const userId = "00000000-0000-4000-8000-000000000901";
  const calls: string[] = [];
  let fileExists = true;
  let failStorage = true;
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    const path = new URL(req.url).pathname;
    calls.push(path);
    const response = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    if (path === "/auth/v1/user") return response({ id: userId });
    if (path.startsWith("/rest/v1/rpc/")) {
      const body = await req.json();
      assert(body.target_user_id === userId, "validated target only");
      if (path.endsWith("/account_deletion_receipts")) {
        return response(fileExists ? [{ name: "house/user/receipt.jpg" }] : []);
      }
      if (path.endsWith("/finish_account_deletion")) {
        assert(!fileExists, "must remove objects before Auth");
      }
      return response(null);
    }
    if (path === "/storage/v1/object/receipts") {
      assert(req.method === "DELETE", "Storage API removal");
      const body = await req.json();
      assert(
        body.prefixes[0] === "house/user/receipt.jpg",
        "exact authorized path",
      );
      if (failStorage) return response({ message: "fixture failure" }, 400);
      fileExists = false;
      return response([]);
    }
    throw new Error(`Unexpected fixture request: ${path}`);
  };
  try {
    const failed = await handleDeleteAccount(
      request({ confirmation: "DELETE" }),
    );
    assert(failed.status === 503, "cleanup failure must not be success");
    assert(
      !calls.some((p) => p.endsWith("/finish_account_deletion")),
      "never finish after failed cleanup",
    );
    failStorage = false;
    const retry = await handleDeleteAccount(
      request({ confirmation: "DELETE" }),
    );
    assert(
      retry.status === 200 && (await retry.json()).deleted === true,
      "retry completes",
    );
    assert(
      calls.at(-1)?.endsWith("/finish_account_deletion"),
      "finalization is last",
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (oldUrl === undefined) Deno.env.delete("SUPABASE_URL");
    else Deno.env.set("SUPABASE_URL", oldUrl);
    if (oldKey === undefined) Deno.env.delete("SUPABASE_SERVICE_ROLE_KEY");
    else Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", oldKey);
  }
});

Deno.test("revokes the Apple authorization before deleting, and stops if it fails", async () => {
  const originalFetch = globalThis.fetch;
  const saved = new Map<string, string | undefined>();
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );
  const pkcs8 = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
  );
  const pem = `-----BEGIN PRIVATE KEY-----\n${
    btoa(String.fromCharCode(...pkcs8))
  }\n-----END PRIVATE KEY-----`;
  const env: Record<string, string> = {
    SUPABASE_URL: "https://fixture.invalid",
    SUPABASE_SERVICE_ROLE_KEY: "fixture-server-only-key",
    APPLE_TEAM_ID: "FIXTURETEAM",
    APPLE_KEY_ID: "FIXTUREKEY",
    APPLE_PRIVATE_KEY: pem,
    APPLE_CLIENT_ID: "com.example.fixture",
  };
  for (const [name, value] of Object.entries(env)) {
    saved.set(name, Deno.env.get(name));
    Deno.env.set(name, value);
  }
  const userId = "00000000-0000-4000-8000-000000000902";
  const calls: string[] = [];
  let revokeOk = false;
  globalThis.fetch = async (input, init) => {
    const req = new Request(input, init);
    const url = new URL(req.url);
    calls.push(url.pathname);
    const response = (body: unknown, status = 200) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    if (url.pathname === "/auth/v1/user") return response({ id: userId });
    if (url.host === "appleid.apple.com") {
      const form = new URLSearchParams(await req.text());
      assert(form.get("client_id") === "com.example.fixture", "client id");
      const [header, claims, signature] = form.get("client_secret")!.split(".");
      const decode = (part: string) =>
        Uint8Array.from(
          atob(part.replace(/-/g, "+").replace(/_/g, "/")),
          (c) => c.charCodeAt(0),
        );
      const verified = await crypto.subtle.verify(
        { name: "ECDSA", hash: "SHA-256" },
        keyPair.publicKey,
        decode(signature),
        new TextEncoder().encode(`${header}.${claims}`),
      );
      assert(verified, "client secret signed with the configured key");
      if (url.pathname === "/auth/token") {
        assert(form.get("code") === "fixture-code", "authorization code");
        return response({ refresh_token: "fixture-refresh" });
      }
      assert(form.get("token") === "fixture-refresh", "revokes refresh token");
      return response({}, revokeOk ? 200 : 400);
    }
    if (url.pathname.startsWith("/rest/v1/rpc/")) {
      if (url.pathname.endsWith("/account_deletion_receipts")) {
        return response([]);
      }
      return response(null);
    }
    throw new Error(`Unexpected fixture request: ${url.pathname}`);
  };
  try {
    const body = { confirmation: "DELETE", appleAuthorizationCode: "fixture-code" };
    const failed = await handleDeleteAccount(request(body));
    assert(failed.status === 503, "revoke failure blocks deletion");
    assert(
      !calls.some((p) => p.startsWith("/rest/v1/rpc/")),
      "nothing deleted when revoke fails",
    );
    revokeOk = true;
    const ok = await handleDeleteAccount(request(body));
    assert(ok.status === 200 && (await ok.json()).deleted === true, "deleted");
    assert(
      calls.indexOf("/auth/revoke") < calls.indexOf("/rest/v1/rpc/prepare_account_deletion"),
      "revoke happens before deletion",
    );
    assert(
      (await handleDeleteAccount(
        request({ confirmation: "DELETE", appleAuthorizationCode: 5 }),
      )).status === 400,
      "code must be a string",
    );
  } finally {
    globalThis.fetch = originalFetch;
    for (const [name, value] of saved) {
      if (value === undefined) Deno.env.delete(name);
      else Deno.env.set(name, value);
    }
  }
});
