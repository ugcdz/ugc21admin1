import { OWNER_EMAIL } from "./owner.functions";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function verifyOwner(client: SupabaseClient<Database>) {
  const { data, error } = await client.auth.getUser();
  if (error || data.user?.email !== OWNER_EMAIL || !data.user.email_confirmed_at) throw new Error("غير مسموح");
}

export async function githubRequest(path: string, init?: RequestInit) {
  const key = process.env["GITHUB_API_KEY"];
  const lovable = process.env["LOVABLE_API_KEY"];
  if (!key || !lovable) throw new Error("اربط حساب GitHub أولاً");
  const response = await fetch(`https://connector-gateway.lovable.dev/github${path}`, {
    ...init, headers: { Accept: "application/vnd.github+json", "Content-Type": "application/json", Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": key },
  });
  if (!response.ok) {
    const body = await response.text();
    console.error(`GitHub [${response.status}]: ${body}`);
    throw new Error(`GitHub [${response.status}]: ${body}`);
  }
  return response.json();
}