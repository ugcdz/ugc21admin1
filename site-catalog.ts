import type { Tables } from "@/integrations/supabase/types";

export function repositoryName(value: string) {
  const name = value.trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, "");
  if (!/^[\w.-]+\/[\w.-]+$/.test(name)) throw new Error("أدخل رابط مستودع GitHub صحيحاً");
  return name;
}

export function catalogPath(value: string) {
  if (!/^public\/[\w/-]+\.json$/.test(value) || value.includes("..")) throw new Error("مسار قائمة التطبيقات غير صالح");
  return value;
}

export function publicApp(app: Tables<"apps">, origin: string) {
  return {
    id: app.id, title: app.title, content_type: app.content_type, description: app.description, specs: app.specs,
    license_request_url: app.license === "licensed" ? `${origin}/license?app=${app.id}` : null,
    license: app.license, price: app.price, size_mb: app.size_mb,
    release_date: app.release_date, update_date: app.update_date,
    images: app.images.map((_, index) => `${origin}/api/public/app-media?id=${app.id}&image=${index}`),
    download_url: app.file_path
      ? (app.license === "free" ? `${origin}/api/public/app-media?id=${app.id}&download=1` : null)
      : app.license === "free" ? app.download_url : null,
  };
}