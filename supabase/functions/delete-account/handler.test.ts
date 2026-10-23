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
