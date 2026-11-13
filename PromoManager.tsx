import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { promoSchema, promoAvailable } from "@/lib/content";
import type { Tables } from "@/integrations/supabase/types";

export function PromoManager() {
  const [sites, setSites] = useState<Tables<"sites">[]>([]);
  const [rows, setRows] = useState<Tables<"promo_codes">[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "w-full rounded-md border bg-input/40 px-3 py-2 text-sm";
  async function load() { const [s, p] = await Promise.all([supabase.from("sites").select("*"), supabase.from("promo_codes").select("*").order("created_at", { ascending: false })]); setSites(s.data ?? []); setRows(p.data ?? []); }
  useEffect(() => { void load(); }, []);
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const f = new FormData(form); setMessage("");
    const site = sites.find(s => s.url?.replace(/\/+$/, "") === String(f.get("site_url")).trim().replace(/\/+$/, ""));
    if (!site) return setMessage("أضف الموقع أولاً من قسم المواقع، ثم أدخل رابطه هنا");
    const parsed = promoSchema.safeParse({ code: f.get("code"), discount_percent: Number(f.get("discount")), max_uses: Number(f.get("max")) });
    if (!parsed.success) return setMessage("استخدم اسماً بالأحرف الإنجليزية والأرقام، وتخفيضاً أكبر من صفر حتى 100% وعدد استخدامات صحيحاً");
    setBusy(true); const { error } = await supabase.from("promo_codes").insert({ ...parsed.data, site_id: site.id }); setBusy(false);
    if (error) setMessage("تعذّر الحفظ؛ قد يكون الكود موجوداً في الموقع"); else { form.reset(); setMessage("تم إنشاء الكود"); await load(); }
  }
  return <div className="space-y-5"><form onSubmit={add} className="grid gap-3 border-y py-4 sm:grid-cols-2">
    <label className="space-y-1 text-sm">رابط الموقع<input name="site_url" aria-label="رابط موقع كود برومو" type="url" required list="promo-sites" dir="ltr" className={input} /><datalist id="promo-sites">{sites.map(s => s.url && <option key={s.id} value={s.url}>{s.title}</option>)}</datalist></label>
    <label className="space-y-1 text-sm">اسم كود برومو<input name="code" required dir="ltr" className={input} /></label>
    <label className="space-y-1 text-sm">نسبة التخفيض (%)<input name="discount" type="number" min="0.01" max="100" step="0.01" required className={input} /></label>
    <label className="space-y-1 text-sm">عدد مرات الاستخدام<input name="max" type="number" min="1" step="1" required className={input} /></label><Button disabled={busy || !sites.length}><Plus /> إنشاء كود برومو</Button>
  </form>{message && <p role="status" className="text-sm">{message}</p>}
  {!rows.length && <p className="py-8 text-center text-muted-foreground">لا توجد أكواد برومو</p>}
  {rows.map(p => <article key={p.id} className="flex flex-wrap items-center gap-4 rounded-md border bg-card p-4"><div className="min-w-0 flex-1"><h2 className="break-all font-mono font-bold">{p.code}</h2><p className="text-xs text-muted-foreground">{sites.find(s => s.id === p.site_id)?.title} · {p.discount_percent}% تخفيض · {p.used_count} / {p.max_uses} استخدام</p></div><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.active} onChange={async e => { const { error } = await supabase.from("promo_codes").update({ active: e.target.checked }).eq("id", p.id); if (error) setMessage("تعذّر التحديث"); await load(); }} />فعّال</label><span className="text-xs text-muted-foreground">{promoAvailable(p) ? "متاح" : "غير متاح"}</span><Button size="icon" variant="ghost" aria-label="حذف كود برومو" onClick={async () => { if (!confirm("حذف الكود؟")) return; const { error } = await supabase.from("promo_codes").delete().eq("id", p.id); if (error) setMessage("تعذّر الحذف"); await load(); }}><Trash2 /></Button></article>)}</div>;
}