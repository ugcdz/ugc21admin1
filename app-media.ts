import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/app-media")({
  server: { handlers: { GET: async ({ request }) => {
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    if (!id || !/^[\da-f-]{36}$/i.test(id)) return new Response("Not found", { status: 404 });
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: app } = await supabaseAdmin.from("apps").select("file_path,file_name,images,license,status,site_id,user_id").eq("id", id).eq("status", "منشور").single();
    if (!app?.site_id) return new Response("Not found", { status: 404 });
    const { data: site } = await supabaseAdmin.from("sites").select("id").eq("id", app.site_id).eq("user_id", app.user_id).single();
    if (!site) return new Response("Not found", { status: 404 });
    const download = params.get("download") === "1";
    if (download && app.license !== "free") {
      if (app.license !== "licensed") return new Response("Download requires authorization", { status: 403 });
      const code = params.get("license");
      if (!code || !/^[a-f0-9-]{72}$/i.test(code)) return new Response("Invalid license", { status: 403 });
      const { data: grant } = await supabaseAdmin.from("license_requests").select("id").eq("app_id", id).eq("user_id", app.user_id).eq("status", "approved").eq("license_code", code).single();
      if (!grant) return new Response("Invalid license", { status: 403 });
    }
    const index = Number(params.get("image"));
    const path = download ? app.file_path : (params.has("image") && Number.isInteger(index) && index >= 0 ? app.images[index] : null);
    if (!path || !path.startsWith(`${app.user_id}/`)) return new Response("Not found", { status: 404 });
    const { data, error } = await supabaseAdmin.storage.from(download ? "app-files" : "app-images").createSignedUrl(path, 300, download ? { download: app.file_name ?? true } : undefined);
    if (error || !data) return new Response("Not found", { status: 404 });
    return new Response(null, { status: 302, headers: { Location: data.signedUrl, "Cache-Control": "no-store" } });
  } } },
});