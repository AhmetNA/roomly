import { createClient } from "npm:@supabase/supabase-js@2.115.0";

import { appleConfig, revokeAppleAuthorization } from "./apple.ts";

const headers = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers });

export async function handleDeleteAccount(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "not_authenticated" }, 401);
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }
  // Reject target IDs rather than silently accepting an apparent delete-other-user request.
  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    !("confirmation" in body) || body.confirmation !== "DELETE" ||
    Object.keys(body).some((key) =>
      key !== "confirmation" && key !== "appleAuthorizationCode"
    )
  ) {
    return json({ error: "invalid_confirmation" }, 400);
  }
  const appleCode = "appleAuthorizationCode" in body
    ? body.appleAuthorizationCode
    : undefined;
  if (
    appleCode !== undefined &&
    (typeof appleCode !== "string" || appleCode.length === 0 ||
      appleCode.length > 2048)
  ) {
    return json({ error: "invalid_confirmation" }, 400);
  }
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return json({ error: "server_configuration" }, 503);
  const admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.auth.getUser(authorization.slice(7));
  if (error || !data.user) return json({ error: "not_authenticated" }, 401);
  const target_user_id = data.user.id;
  // Revoke before anything is deleted, so a failure leaves the account intact
  // and the user can simply retry.
  if (appleCode !== undefined) {
    const config = appleConfig();
    if (!config) return json({ error: "apple_revoke_unavailable" }, 503);
    let revoked = false;
    try {
      revoked = await revokeAppleAuthorization(appleCode, config);
    } catch {
      revoked = false;
    }
    if (!revoked) {
      return json({ error: "apple_revoke_failed", retryable: true }, 503);
    }
  }
  try {
    const { error: prepareError } = await admin.rpc(
      "prepare_account_deletion",
      { target_user_id },
    );
    if (prepareError) throw new Error("prepare");
    // Bound each invocation; retry resumes the same deletion without restoring access.
    for (let batch = 0; batch < 10; batch++) {
      const { data: receipts, error: listError } = await admin.rpc(
        "account_deletion_receipts",
        { target_user_id },
      );
      if (listError) throw new Error("list");
      if (!receipts?.length) {
        const { error: finishError } = await admin.rpc(
          "finish_account_deletion",
          { target_user_id },
        );
        if (finishError) throw new Error("finish");
        return json({ deleted: true });
      }
      const { error: removeError } = await admin.storage.from("receipts")
        .remove(receipts.map((receipt: { name: string }) => receipt.name));
      if (removeError) throw new Error("storage");
    }
    return json({ deleted: false, pending: true }, 202);
  } catch {
    // No raw SQL, storage paths, account IDs or tokens in the response/logs.
    return json({ error: "deletion_incomplete", retryable: true }, 503);
  }
}
