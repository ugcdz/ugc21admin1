import { useCallback, useEffect, useState } from "react";
import { AppWindow, Briefcase, Globe, LifeBuoy, LogOut, Plus, Shield, Trash2, ExternalLink, Bell, TicketPercent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppsManager } from "./AppsManager";
import { LicenseInbox } from "./LicenseInbox";
import { PromoManager } from "./PromoManager";
import { PURPOSES } from "@/lib/content";
import { Button } from "@/components/ui/button";

type TableName = "projects" | "sites" | "apps" | "tickets" | "security_checks";
type Row = { id: string; title: string; client: string | null; url: string | null; status: string; notes: string | null; created_at: string; purpose?: string };

const SECTIONS: { key: TableName; label: string; icon: typeof Globe; statuses: string[] }[] = [
  { key: "projects", label: "مشاريع العملاء", icon: Briefcase, statuses: ["جديد", "قيد التنفيذ", "مكتمل"] },
  { key: "sites", label: "المواقع", icon: Globe, statuses: ["يعمل", "صيانة", "متوقف"] },
  { key: "apps", label: "محتوى المواقع", icon: AppWindow, statuses: ["منشور", "تطوير", "مخفي"] },
  { key: "tickets", label: "تذاكر الدعم", icon: LifeBuoy, statuses: ["مفتوحة", "قيد المعالجة", "مغلقة"] },
  { key: "security_checks", label: "فحوصات الأمن", icon: Shield, statuses: ["آمن", "تحذير", "خطر"] },
];

function statusTone(i: number) {
  return ["bg-accent text-accent-foreground", "bg-warning/20 text-warning", "bg-success/20 text-success"][i] ?? "bg-muted";
}

export function Dashboard() {
  const [active, setActive] = useState<TableName>("projects");
  const [special, setSpecial] = useState<"licenses" | "promos" | null>(null);
  const [pending, setPending] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const section = SECTIONS.find((s) => s.key === active) ?? SECTIONS[0];
  if (!section) throw new Error("Missing dashboard sections");

  const load = useCallback(async () => {
    const { data } = await supabase.from(active).select("*").order("created_at", { ascending: false });
    setRows((data as Row[]) ?? []);
    const c: Record<string, number> = {};
    await Promise.all(SECTIONS.map(async (s) => {
      const { count } = await supabase.from(s.key).select("id", { count: "exact", head: true });
      c[s.key] = count ?? 0;
    }));
    setCounts(c);
  }, [active]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const refresh = async () => { const { count } = await supabase.from("license_requests").select("id", { count: "exact", head: true }).eq("status", "pending"); setPending(count ?? 0); }; void refresh(); const timer = setInterval(refresh, 15000); return () => clearInterval(timer); }, []);

  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const row = {
      title: String(f.get("title")),
      client: String(f.get("client") || "") || null,
      url: String(f.get("url") || "") || null,
      notes: String(f.get("notes") || "") || null,
      status: SECTIONS.find((s) => s.key === active)?.statuses[0] ?? "جديد",
    };
    const { error } = active === "sites"
      ? await supabase.from("sites").insert({ ...row, purpose: String(f.get("purpose") ?? "apps") })
      : await supabase.from(active).insert(row);
    if (error) return alert("تعذّر الحفظ");
    form.reset();
    load();
  }

  async function setStatus(id: string, status: string) {
    await supabase.from(active).update({ status }).eq("id", id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("حذف هذا العنصر؟")) return;
    await supabase.from(active).delete().eq("id", id);
    load();
  }

  const input = "rounded-md border bg-input/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div dir="rtl" className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-l bg-sidebar p-4 md:flex">
        <div className="mb-8 font-mono text-xl font-bold tracking-wider text-primary">UGC 21<span className="text-muted-foreground"> / admin</span></div>
        <nav className="space-y-1">
          {SECTIONS.map((s) => (
            <button key={s.key} onClick={() => { setActive(s.key); setSpecial(null); }}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition ${active === s.key ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              <s.icon className="h-4 w-4" />
              <span className="flex-1 text-right">{s.label}</span>
              <span className="font-mono text-xs">{counts[s.key] ?? 0}</span>
            </button>
          ))}
          <Button variant="ghost" className="w-full justify-start" onClick={() => setSpecial("licenses")}><Bell /> إشعارات الترخيص <span className="ms-auto">{pending}</span></Button>
          <Button variant="ghost" className="w-full justify-start" onClick={() => setSpecial("promos")}><TicketPercent /> كود برومو</Button>
        </nav>
        <div className="mt-auto space-y-2 border-t pt-4 text-xs text-muted-foreground">
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 hover:text-destructive">
            <LogOut className="h-4 w-4" /> خروج
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 cyber-grid p-4 md:p-8">
        <div className="mb-4 flex gap-2 overflow-x-auto md:hidden">
          {SECTIONS.map((s) => (
            <button key={s.key} onClick={() => { setActive(s.key); setSpecial(null); }}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${active === s.key ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{s.label}</button>
          ))}
          <Button variant="outline" onClick={() => setSpecial("licenses")}><Bell /> {pending}</Button>
          <Button variant="outline" onClick={() => setSpecial("promos")}><TicketPercent /> كود برومو</Button>
        </div>

        <h1 className="mb-6 flex items-center gap-3 text-2xl font-bold"><section.icon className="h-6 w-6 text-primary" />{special === "licenses" ? "إشعارات الترخيص" : special === "promos" ? "كود برومو" : section.label}</h1>

        {special === "licenses" ? <LicenseInbox /> : special === "promos" ? <PromoManager /> : active === "apps" ? <AppsManager /> : <>
        <form onSubmit={add} className="mb-6 grid gap-3 rounded-xl border bg-card p-4 md:grid-cols-5">
          <input name="title" required placeholder="الاسم" className={input} />
          <input name="client" placeholder="العميل" className={input} />
          <input name="url" placeholder="الرابط" dir="ltr" className={input} />
          <input name="notes" placeholder="ملاحظات" className={input} />
          {active === "sites" && <label className="text-sm">وظيفة الموقع<select name="purpose" className={`${input} w-full`}>{Object.entries(PURPOSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
          <button className="flex items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> إضافة
          </button>
        </form>

        <div className="grid gap-3">
          {rows.length === 0 && <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">لا توجد عناصر بعد</p>}
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{r.title}</div>
                {active === "sites" && <label className="mt-2 block text-xs text-muted-foreground">وظيفة الموقع<select aria-label={`وظيفة ${r.title}`} value={r.purpose ?? "apps"} className={`${input} ms-2 max-w-full`} onChange={async e => { const { error } = await supabase.from("sites").update({ purpose: e.target.value }).eq("id", r.id); if (error) alert("تعذّر التحديث"); else load(); }}>{Object.entries(PURPOSES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
                <div className="text-xs text-muted-foreground">
                  {[r.client, r.notes].filter(Boolean).join(" · ")}
                </div>
                {r.url && (
                  <a href={r.url.startsWith("http") ? r.url : `https://${r.url}`} target="_blank" rel="noreferrer" dir="ltr"
                    className="mt-1 inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline">
                    {r.url} <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="flex gap-1">
                {section.statuses.map((st, i) => (
                  <button key={st} onClick={() => setStatus(r.id, st)}
                    className={`rounded-full px-3 py-1 text-xs transition ${r.status === st ? statusTone(i) : "text-muted-foreground hover:bg-muted"}`}>{st}</button>
                ))}
              </div>
              <button onClick={() => remove(r.id)} className="text-muted-foreground hover:text-destructive" aria-label="حذف">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        </>}
      </main>
    </div>
  );
}
