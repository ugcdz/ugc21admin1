import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const licenseInfo = createServerFn({ method: "POST" }).inputValidator((v: unknown) => z.object({ appId: z.string().uuid() }).parse(v)).handler(async ({ data }) => {
  const { licenseChallenge } = await import("./licenses.server");
  return licenseChallenge(data.appId);
});
export const requestLicense = createServerFn({ method: "POST" }).inputValidator((v: unknown) => z.object({ token: z.string().max(2000), name: z.string().trim().min(2).max(100), contact: z.string().trim().min(5).max(200) }).parse(v)).handler(async ({ data }) => {
  const { submitLicense } = await import("./licenses.server");
  return submitLicense(data);
});
export const decideLicense = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => z.object({ id: z.string().uuid(), approve: z.boolean() }).parse(v)).handler(async ({ data, context }) => {
  const { verifyOwner } = await import("./github.server");
  await verifyOwner(context.supabase);
  const { data: row } = await context.supabase.from("license_requests").select("app_id").eq("id", data.id).eq("status", "pending").single();
  if (!row) throw new Error("تمت معالجة الطلب أو لم يعد موجوداً");
  const { data: app } = await context.supabase.from("apps").select("status,license,file_path").eq("id", row.app_id).single();
  if (data.approve && (!app?.file_path || app.license !== "licensed" || app.status !== "منشور")) throw new Error("أضف ملفاً منشوراً مرخّصاً قبل الموافقة");
  const code = data.approve ? crypto.randomUUID() + crypto.randomUUID() : null;
  const { data: saved, error } = await context.supabase.from("license_requests").update({ status: data.approve ? "approved" : "rejected", license_code: code, decided_at: new Date().toISOString() }).eq("id", data.id).eq("status", "pending").select("id").single();
  if (error || !saved) throw new Error("تعذّرت معالجة الطلب");
  return { ok: true };
});