import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Github, RefreshCw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { connectSite, syncSite, installSiteCatalog } from "@/lib/sites.functions";
import type { Tables } from "@/integrations/supabase/types";

export function SiteConnection({ site, onChanged }: { site: Tables<"sites">; onChanged: () => void }) {
  const connect = useServerFn(connectSite);
  const sync = useServerFn(syncSite);
  const install = useServerFn(installSiteCatalog);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const input = "min-w-0 w-full rounded-md border bg-input/40 px-3 py-2 text-sm";
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      await connect({ data: { siteId: site.id, repo: String(form.get("repo")), branch: String(form.get("branch")), path: String(form.get("path")) } });
      setMessage("تم ربط المستودع"); onChanged();
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذّر الربط"); }
    finally { setBusy(false); }
  }
  async function publish() {
    setBusy(true); setMessage("");
    try { const result = await sync({ data: { siteId: site.id } }); setMessage(`تم إرسال ${result.count} تطبيق إلى GitHub`); onChanged(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "تعذّرت المزامنة"); }
    finally { setBusy(false); }
  }
  async function enable() {
    if (!confirm("تفعيل قراءة التطبيقات من هذه اللوحة في الموقع؟ سيتم تعديل ملف صفحة التطبيقات في GitHub.")) return;
    setBusy(true); setMessage("");
    try { await install({ data: { siteId: site.id } }); setMessage("تم تفعيل الربط في GitHub؛ أرسل التطبيقات الآن"); }
    catch (error) { setMessage(error instanceof Error ? error.message : "تعذّر تفعيل الربط"); }
    finally { setBusy(false); }
  }
  return <section className="space-y-3 border-y py-4">
    <h2 className="flex items-center gap-2 font-semibold"><Github className="h-4 w-4" /> مستودع {site.title}</h2>
    <form key={`${site.id}:${site.github_repo}`} onSubmit={save} className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1 text-sm sm:col-span-2">رابط GitHub<input className={input} name="repo" dir="ltr" required defaultValue={site.github_repo ?? ""} placeholder="https://github.com/owner/repository" /></label>
      <label className="space-y-1 text-sm">الفرع<input className={input} name="branch" dir="ltr" required defaultValue={site.github_branch} /></label>
      <label className="space-y-1 text-sm">ملف قائمة التطبيقات<input className={input} name="path" dir="ltr" required defaultValue={site.catalog_path} /></label>
      <Button disabled={busy} type="submit" variant="outline"><Save /> حفظ الربط</Button>
      <Button disabled={busy || !site.github_repo} type="button" onClick={publish}><RefreshCw className={busy ? "animate-spin" : ""} /> إرسال التطبيقات للموقع</Button>
      <Button disabled={busy || !site.github_repo} type="button" variant="outline" className="sm:col-span-2" onClick={enable}><Github /> تفعيل ربط صفحة التطبيقات</Button>
    </form>
    {site.synced_at && <p className="text-xs text-muted-foreground">آخر إرسال: {new Date(site.synced_at).toLocaleString("ar-DZ")}</p>}
    {message && <p role="status" className="break-words text-sm">{message}</p>}
  </section>;
}