import { createServerFn } from "@tanstack/react-start";

export const OWNER_EMAIL = "owner@ugc21.local";

async function sha(s: string) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

// Verifies the owner password and makes sure the single owner account exists.
export const prepareOwnerLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => ({ password: String(d.password ?? "") }))
  .handler(async ({ data }) => {
    const expected = process.env["OWNER_PASSWORD"];
    if (!expected) throw new Error("OWNER_PASSWORD is not set");
    const [a, b] = await Promise.all([sha(data.password), sha(expected)]);
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
    if (diff !== 0) return { ok: false as const };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users.find((u) => u.email === OWNER_EMAIL);
    if (!existing) {
      await supabaseAdmin.auth.admin.createUser({ email: OWNER_EMAIL, password: expected, email_confirm: true });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: expected });
    }
    return { ok: true as const };
  });
