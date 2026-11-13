import { useCallback, useEffect, useState } from "react";
import { Globe, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { SiteConnection } from "./SiteConnection";
import { CONTENT_TYPES, defaultContentType } from "@/lib/content";

type Site = Tables<"sites">;
type App = Tables<"apps">;

const input = "w-full rounded-md border bg-input/40 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
const LICENSES: Record<string, string> = { free: "مجاني", licensed: "مرخّص", paid: "مدفوع" };

function useSignedUrls(paths: string[]) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = paths.join("|");
  useEffect(() => {
    if (!paths.length) return;
    supabase.storage.from("app-images").createSignedUrls(paths, 3600).then(({ data }) => {
      const m: Record<string, string> = {};
      data?.forEach((d) => { if (d.path && d.signedUrl) m[d.path] = d.signedUrl; });
      setUrls(m);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return urls;
}

export function AppsManager() {
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState<string>("");
  const [apps, setApps] = useState<App[]>([]);
  const [editing, setEditing] = useState<App | "new" | null>(null);

  const loadSites = useCallback(() => {
    supabase.from("sites").select("*").order("created_at").then(({ data }) => {
      setSites(data ?? []);
      const first = data?.[0];
      if (first) setSiteId((s) => s || first.id);
    });
  }, []);
  useEffect(loadSites, [loadSites]);

  const load = useCallback(async () => {
    if (!siteId) return setApps([]);
    const { data } = await supabase.from("apps").select("*").eq("site_id", siteId).order("created_at", { ascending: false });
    setApps(data ?? []);
  }, [siteId]);
  useEffect(() => { load(); }, [load]);

  const urls = useSignedUrls(apps.flatMap((a) => a.images.slice(0, 1)));
  const site = sites.find((s) => s.id === siteId);

  async function remove(a: App) {
    if (!confirm(`حذف ${a.title}؟`)) return;
    const { error } = await supabase.from("apps").delete().eq("id", a.id);
    if (error) return alert("تعذّر حذف التطبيق");
    if (a.images.length) await supabase.storage.from("app-images").remove(a.images);
    if (a.file_path) await supabase.storage.from("app-files").remove([a.file_path]);
    load();
  }

  if (!sites.length)
    return <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">أضف موقعاً أولاً من قسم «المواقع» ثم عد هنا لإضافة تطبيقاته.</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <Globe className="h-5 w-5 text-primary" />
        <span className="text-sm text-muted-foreground">الموقع المُتحكَّم فيه:</span>
        <select value={siteId} onChange={(e) => setSiteId(e.target.value)} className={`${input} w-auto min-w-48 font-semibold`}>
          {sites.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
        {site?.url && <span dir="ltr" className="font-mono text-xs text-primary">{site.url}</span>}
        <button onClick={() => setEditing("new")} className="ms-auto flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> إضافة محتوى
        </button>
      </div>

      {site && <SiteConnection key={site.id} site={site} onChanged={loadSites} />}

      {apps.length === 0 && <p className="rounded-xl border border-dashed p-10 text-center text-muted-foreground">لا يوجد محتوى في هذا الموقع بعد</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {apps.map((a) => (
          <div key={a.id} className="overflow-hidden rounded-xl border bg-card">
            <div className="aspect-video bg-muted">
              {a.images[0] && urls[a.images[0]] && <img src={urls[a.images[0]]} alt={a.title} className="h-full w-full object-cover" />}
            </div>
            <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold">{a.title}</h3>
                <span className="text-xs text-muted-foreground">{CONTENT_TYPES[a.content_type]}</span>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {LICENSES[a.license] ?? a.license}{a.license === "paid" && a.price != null ? ` · ${a.price}` : ""}
                </span>
              </div>
              {a.description && <p className="line-clamp-2 text-sm text-muted-foreground">{a.description}</p>}
              <div className="grid grid-cols-3 gap-2 font-mono text-xs text-muted-foreground">
                <div><div className="text-[10px]">الحجم</div>{a.size_mb != null ? `${a.size_mb} MB` : "—"}</div>
                <div><div className="text-[10px]">الإصدار</div>{a.release_date ?? "—"}</div>
                <div><div className="text-[10px]">التحديث</div>{a.update_date ?? "—"}</div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditing(a)} className="flex items-center gap-1 text-sm text-primary"><Pencil className="h-4 w-4" />تعديل</button>
                <button onClick={() => remove(a)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" />حذف</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && <AppForm purpose={site?.purpose ?? "apps"} siteId={siteId} app={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function AppForm({ siteId, purpose, app, onClose, onSaved }: { siteId: string; purpose: string; app: App | null; onClose: () => void; onSaved: () => void }) {
  const [contentType, setContentType] = useState(app?.content_type ?? defaultContentType(purpose));
  const [images, setImages] = useState<string[]>(app?.images ?? []);
  const [license, setLicense] = useState(app?.license ?? "free");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [filePath, setFilePath] = useState(app?.file_path ?? null);
  const [fileName, setFileName] = useState(app?.file_name ?? null);
  const [fileSize, setFileSize] = useState<number | null>(app?.size_mb ?? null);
  const urls = useSignedUrls(images);

  async function uploadApp(file: File | undefined) {
    if (!file) return;
    if (contentType === "book" && !file.name.toLowerCase().endsWith(".pdf")) return setError("اختر كتاباً بصيغة PDF");
    setBusy(true); setError("");
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error("سجّل الدخول مجدداً");
      const path = `${data.user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("app-files").upload(path, file, { contentType: "application/octet-stream" });
      if (error) throw new Error(error.message);
      setFilePath(path); setFileName(file.name); setFileSize(Number((file.size / (1024 * 1024)).toFixed(2)));
    } catch (error) { setError(error instanceof Error ? error.message : "تعذّر رفع الملف"); }
    finally { setBusy(false); }
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setError("سجّل الدخول مجدداً"); setBusy(false); return; }
    const added: string[] = [];
    for (const f of Array.from(files)) {
      const path = `${u.user.id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("app-images").upload(path, f);
      if (!error) added.push(path); else setError("تعذّر رفع صورة: " + f.name);
    }
    setImages((p) => [...p, ...added]);
    setBusy(false);
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim() || null;
    const n = (k: string) => { const v = s(k); return v == null ? null : Number(v); };
    const row = {
      site_id: siteId,
      content_type: contentType,
      title: s("title") ?? "",
      description: s("description"),
      specs: s("specs"),
      images,
      download_url: s("download_url"),
      file_path: filePath,
      file_name: fileName,
      license,
      price: license === "paid" ? n("price") : null,
      size_mb: filePath ? fileSize : n("size_mb"),
      release_date: s("release_date"),
      update_date: s("update_date"),
      status: "منشور",
    };
    setBusy(true);
    const { error } = app ? await supabase.from("apps").update(row).eq("id", app.id) : await supabase.from("apps").insert(row);
    setBusy(false);
    if (error) setError("تعذّر الحفظ"); else onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur">
      <form onSubmit={save} className="my-8 w-full max-w-2xl space-y-4 rounded-xl border bg-card p-6 glow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{app ? "تعديل المحتوى" : "إضافة محتوى"}</h2>
          <button type="button" onClick={onClose} aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        <label className="block space-y-1 text-sm">نوع المحتوى<select value={contentType} onChange={e => setContentType(e.target.value)} className={input}>{Object.entries(CONTENT_TYPES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="block space-y-1 text-sm">اسم المحتوى<input name="title" required defaultValue={app?.title} className={input} /></label>
        <label className="block space-y-1 text-sm">الوصف<textarea name="description" rows={3} defaultValue={app?.description ?? ""} className={input} /></label>
        <label className="block space-y-1 text-sm">المواصفات<textarea name="specs" rows={4} placeholder="النظام المطلوب، الذاكرة، المميزات..." defaultValue={app?.specs ?? ""} className={input} /></label>

        <div className="space-y-2 text-sm">
          <div>صور المحتوى</div>
          <div className="flex flex-wrap gap-2">
            {images.map((p) => (
              <div key={p} className="relative h-20 w-28 overflow-hidden rounded-md border bg-muted">
                {urls[p] && <img src={urls[p]} alt="" className="h-full w-full object-cover" />}
                <button type="button" onClick={() => setImages((x) => x.filter((i) => i !== p))}
                  className="absolute end-1 top-1 rounded-full bg-background/80 p-0.5" aria-label="إزالة"><X className="h-3 w-3" /></button>
              </div>
            ))}
            <label className="flex h-20 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed text-xs text-muted-foreground hover:border-primary">
              <ImagePlus className="h-5 w-5" /> رفع صور
              <input type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
            </label>
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div>نوع التحميل</div>
          <div className="flex gap-2">
            {Object.entries(LICENSES).map(([k, v]) => (
              <button type="button" key={k} onClick={() => setLicense(k)}
                className={`flex-1 rounded-md border py-2 ${license === k ? "border-primary bg-accent text-accent-foreground" : "text-muted-foreground"}`}>{v}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-sm sm:col-span-2">ملف المحتوى<input aria-label="ملف المحتوى" type="file" accept={contentType === "book" ? ".pdf,application/pdf" : contentType === "song" ? "audio/*" : contentType === "video" ? "video/*" : contentType === "image" ? "image/*" : undefined} disabled={busy} className={input} onChange={(e) => uploadApp(e.target.files?.[0])} /></label>
          {fileName && <div className="flex min-w-0 items-center gap-2 text-sm sm:col-span-2"><span dir="ltr" className="min-w-0 break-all">{fileName} · {fileSize} MB</span><Button type="button" size="icon" variant="ghost" aria-label="إزالة ملف التطبيق" onClick={() => { setFilePath(null); setFileName(null); }}><X /></Button></div>}
          {!filePath && <label className="space-y-1 text-sm">رابط تحميل بديل<input name="download_url" dir="ltr" defaultValue={app?.download_url ?? ""} className={input} /></label>}
          {license === "paid" && <label className="space-y-1 text-sm">السعر<input name="price" type="number" step="0.01" min="0" defaultValue={app?.price ?? ""} className={input} /></label>}
          <label className="space-y-1 text-sm">الحجم (MB)<input name="size_mb" type="number" step="0.01" min="0" key={fileSize} defaultValue={fileSize ?? ""} readOnly={Boolean(filePath)} className={input} /></label>
          <label className="space-y-1 text-sm">تاريخ الإصدار<input name="release_date" type="date" defaultValue={app?.release_date ?? ""} className={input} /></label>
          <label className="space-y-1 text-sm">تاريخ التحديث<input name="update_date" type="date" defaultValue={app?.update_date ?? ""} className={input} /></label>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={busy} className="w-full rounded-md bg-primary py-2 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy ? "جارٍ..." : "حفظ"}
        </button>
      </form>
    </div>
  );
}
