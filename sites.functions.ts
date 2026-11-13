import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { catalogPath, publicApp, repositoryName } from "./site-catalog";
import { z } from "zod";

export const connectSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ siteId: z.string().uuid(), repo: z.string(), branch: z.string().min(1), path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    const { verifyOwner, githubRequest } = await import("./github.server");
    await verifyOwner(context.supabase);
    const repo = repositoryName(data.repo);
    const path = catalogPath(data.path);
    const info = await githubRequest(`/repos/${repo}`);
    if (!info.permissions?.push) throw new Error("حساب GitHub لا يملك صلاحية تعديل هذا المستودع");
    await githubRequest(`/repos/${repo}/branches/${encodeURIComponent(data.branch)}`);
    const { data: saved, error } = await context.supabase.from("sites").update({ github_repo: repo, github_branch: data.branch, catalog_path: path }).eq("id", data.siteId).select("id").single();
    if (error || !saved) throw new Error("تعذّر حفظ ربط الموقع");
    return { ok: true };
  });

export const syncSite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ siteId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { verifyOwner, githubRequest } = await import("./github.server");
    await verifyOwner(context.supabase);
    const { data: site, error } = await context.supabase.from("sites").select("*").eq("id", data.siteId).single();
    if (error || !site?.github_repo) throw new Error("اربط مستودع الموقع أولاً");
    const repo = repositoryName(site.github_repo);
    const path = catalogPath(site.catalog_path);
    const { data: apps, error: appError } = await context.supabase.from("apps").select("*").eq("site_id", site.id).eq("status", "منشور").order("created_at", { ascending: false });
    if (appError) throw new Error("تعذّر قراءة التطبيقات");
    const requestOrigin = new URL(getRequest().url).origin;
    const origin = requestOrigin.includes("localhost") ? "https://id-preview--4278ffb0-b8ca-426a-9dd8-fbedb06ad28c.lovable.app" : requestOrigin;
    const content = JSON.stringify({ site: site.title, purpose: site.purpose, apps: (apps ?? []).map((a) => publicApp(a, origin)) }, null, 2);
    const encoded = btoa(Array.from(new TextEncoder().encode(content), (byte) => String.fromCharCode(byte)).join(""));
    const endpoint = `/repos/${repo}/contents/${path}`;
    const tree = await githubRequest(`/repos/${repo}/git/trees/${encodeURIComponent(site.github_branch)}?recursive=1`);
    if (tree.truncated) throw new Error("المستودع كبير؛ تعذّر فحص ملف القائمة بأمان");
    const existing = tree.tree?.find((item: { path: string }) => item.path === path);
    const result = await githubRequest(endpoint, { method: "PUT", body: JSON.stringify({ message: `Update ${site.title} application catalog`, branch: site.github_branch, content: encoded, ...(existing?.sha ? { sha: existing.sha } : {}) }) });
    const { error: updateError } = await context.supabase.from("sites").update({ synced_at: new Date().toISOString() }).eq("id", site.id);
    if (updateError) throw new Error("تم إرسال القائمة لكن تعذّر حفظ وقت المزامنة");
    return { url: String(result.commit.html_url), count: apps?.length ?? 0 };
  });

export const installSiteCatalog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ siteId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { verifyOwner, githubRequest } = await import("./github.server");
    await verifyOwner(context.supabase);
    const { data: site } = await context.supabase.from("sites").select("*").eq("id", data.siteId).single();
    if (!site?.github_repo || !site.url) throw new Error("احفظ رابط الموقع ومستودعه أولاً");
    const repo = repositoryName(site.github_repo);
    const path = catalogPath(site.catalog_path).replace(/^public\//, "");
    const url = new URL(site.url.startsWith("http") ? site.url : `https://${site.url}`);
    if (url.protocol !== "https:") throw new Error("رابط الموقع يجب أن يبدأ بـ https");
    const file = await githubRequest(`/repos/${repo}/contents/src/lib/apps.ts?ref=${encodeURIComponent(site.github_branch)}`);
    const source = new TextDecoder().decode(Uint8Array.from(atob(file.content.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
    if (source.includes("UGC_OWNER_CATALOG")) return { ok: true };
    const start = source.indexOf("export const appsQueryOptions = {");
    const end = source.indexOf("/** Every app", start);
    if (start < 0 || end < 0 || !source.includes('export function useAppImageUrls')) throw new Error("هذا الموقع يحتاج تهيئة خاصة؛ لم يتم تغيير أي ملف");
    const replacement = `// UGC_OWNER_CATALOG: managed by the owner's private dashboard.\nexport const appsQueryOptions = {\n  queryKey: ["apps", "public"],\n  queryFn: async (): Promise<AppItem[]> => {\n    const response = await fetch(${JSON.stringify(new URL(path, url.origin + "/").href)}, { cache: "no-store" });\n    if (!response.ok) throw new Error("تعذّر تحميل التطبيقات");\n    const catalog = await response.json();\n    return catalog.apps.map((a: { id: string; title: string; description: string | null; specs: string | null; license: string; price: number | null; size_mb: number | null; download_url: string | null; release_date: string | null; update_date: string | null; images: string[] }) => ({\n      id: a.id, name: a.title, description: [a.description, a.specs].filter(Boolean).join("\\n"),\n      platform: a.license === "paid" ? "مدفوع" + (a.price != null ? " · " + a.price : "") : a.license === "licensed" ? "مرخّص" : "مجاني",\n      version: "—", size_label: a.size_mb != null ? a.size_mb + " MB" : "",\n      file_path: null, external_url: a.download_url, release_date: a.release_date,\n      is_active: true, image_paths: a.images, created_at: a.release_date ?? "", updated_at: a.update_date ?? "",\n    }));\n  },\n  staleTime: 30_000,\n};\n\n`;
    let updated = source.slice(0, start) + replacement + source.slice(end);
    updated = updated.replace('const paths = apps.flatMap((a) => a.image_paths ?? []);', 'const paths = apps.flatMap((a) => a.image_paths ?? []);\n  const direct = Object.fromEntries(paths.filter((p) => p.startsWith("https://")).map((p) => [p, p]));\n  const stored = paths.filter((p) => !p.startsWith("https://"));');
    updated = updated.replace('enabled: paths.length > 0,', 'enabled: paths.length > 0,');
    updated = updated.replace('const { data } = await supabase.storage.from("apps").createSignedUrls(paths, 3600);\n      const urls: Record<string, string> = {};', 'const { data } = stored.length ? await supabase.storage.from("apps").createSignedUrls(stored, 3600) : { data: [] };\n      const urls: Record<string, string> = { ...direct };');
    const content = btoa(Array.from(new TextEncoder().encode(updated), (byte) => String.fromCharCode(byte)).join(""));
    await githubRequest(`/repos/${repo}/contents/src/lib/apps.ts`, { method: "PUT", body: JSON.stringify({ message: "Connect public apps page to UGC owner dashboard catalog", branch: site.github_branch, sha: file.sha, content }) });
    return { ok: true };
  });