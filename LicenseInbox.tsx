import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Check, Copy, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { decideLicense } from "@/lib/licenses.functions";
import type { Tables } from "@/integrations/supabase/types";

export function LicenseInbox() {
  const [rows, setRows] = useState<Tables<"license_requests">[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const decide = useServerFn(decideLicense);
  async function load() {
    const [{ data, error }, apps] = await Promise.all([supabase.from("license_requests").select("*").order("created_at", { ascending: false }), supabase.from("apps").select("id,title")]);
    if (error) setMessage("تعذّر تحميل الإشعارات");
    else setRows(data ?? []);
    setTitles(Object.fromEntries((apps.data ?? []).map(a => [a.id, a.title])));
  }
  useEffect(() => { void load(); const timer = setInterval(load, 30000); return () => clearInterval(timer); }, []);
  async function act(id: string, approve: boolean) {
    setBusy(true); setMessage("");
    try { await decide({ data: { id, approve } }); await load(); }
    catch (e) { setMessage(e instanceof Error ? e.message : "تعذّرت المعالجة"); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4">
    <div className="flex items-center justify-between"><span>{rows.filter(r => r.status === "pending").length} طلبات جديدة</span><Button variant="outline" onClick={load}><RefreshCw /> تحديث</Button></div>
    {message && <p role="status" className="text-sm text-destructive">{message}</p>}
    {!rows.length && <p className="py-10 text-center text-muted-foreground">لا توجد طلبات ترخيص</p>}
    {rows.map(r => <article key={r.id} className="space-y-3 rounded-md border bg-card p-4">
      <div className="flex flex-wrap justify-between gap-2"><h2 className="font-semibold">{titles[r.app_id] ?? "محتوى محذوف"}</h2><span className="text-sm text-primary">{{ pending: "بانتظار الترخيص", approved: "تم الترخيص", rejected: "مرفوض" }[r.status]}</span></div>
      <p className="break-words text-sm">{r.requester_name} · <bdi>{r.contact}</bdi></p><p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("ar-DZ")}</p>
      {r.status === "pending" && <div className="flex gap-2"><Button disabled={busy} onClick={() => act(r.id, true)}><Check /> إعطاء ترخيص</Button><Button disabled={busy} variant="outline" onClick={() => act(r.id, false)}><X /> رفض</Button></div>}
      {r.license_code && <div className="space-y-2"><p className="break-all font-mono text-xs" dir="ltr">{r.license_code}</p><Button variant="outline" onClick={async () => { try { await navigator.clipboard.writeText(`كود الترخيص: ${r.license_code}\n${window.location.origin}/license?app=${r.app_id}`); setMessage("تم نسخ الكود ورابط التنزيل؛ أرسلهما إلى صاحب الطلب"); } catch { setMessage("تعذّر النسخ"); } }}><Copy /> نسخ الكود ورابط التنزيل</Button></div>}
    </article>)}
  </div>;
}