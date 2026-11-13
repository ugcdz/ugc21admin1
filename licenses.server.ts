import { z } from "zod";

async function key() {
  const secret = process.env["OWNER_PASSWORD"];
  if (!secret) throw new Error("الترخيص غير متاح حالياً");
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
const hex = (a: ArrayBuffer) => Array.from(new Uint8Array(a), b => b.toString(16).padStart(2, "0")).join("");
async function published(appId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: app } = await supabaseAdmin.from("apps").select("id,title,user_id,site_id,file_path,license,status").eq("id", appId).eq("license", "licensed").eq("status", "منشور").single();
  if (!app?.file_path || !app.site_id) throw new Error("هذا المحتوى غير متاح للترخيص");
  const { data: site } = await supabaseAdmin.from("sites").select("id").eq("id", app.site_id).eq("user_id", app.user_id).single();
  if (!site) throw new Error("هذا المحتوى غير متاح");
  return app;
}
export async function licenseChallenge(appId: string) {
  const app = await published(appId);
  const payload = `${appId}:${Date.now() + 600000}:${crypto.randomUUID()}`;
  const signature = hex(await crypto.subtle.sign("HMAC", await key(), new TextEncoder().encode(payload)));
  return { title: app.title, token: `${payload}.${signature}` };
}
export async function submitLicense(data: { token: string; name: string; contact: string }) {
  const [payload, signature] = data.token.split(".");
  if (!payload || !signature || !/^[a-f0-9]{64}$/.test(signature)) throw new Error("أعد فتح الصفحة ثم أرسل الطلب");
  const [appId, expires, nonce] = payload.split(":");
  z.string().uuid().parse(appId); z.string().uuid().parse(nonce);
  if (!expires || Number(expires) < Date.now()) throw new Error("انتهت صلاحية النموذج؛ أعد فتح الصفحة");
  const valid = await crypto.subtle.verify("HMAC", await key(), Uint8Array.from(signature.match(/../g) ?? [], v => parseInt(v, 16)), new TextEncoder().encode(payload));
  if (!valid || !appId || !nonce) throw new Error("الطلب غير صالح");
  const app = await published(appId);
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { error } = await supabaseAdmin.from("license_requests").insert({ app_id: app.id, user_id: app.user_id, requester_name: data.name, contact: data.contact, submission_nonce: nonce });
  if (error) throw new Error("تم إرسال هذا الطلب سابقاً أو تعذّر حفظه");
  return { ok: true };
}