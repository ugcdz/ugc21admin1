import { createFileRoute } from "@tanstack/react-router";
import { publicApp } from "@/lib/site-catalog";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

// Public read-only feed of apps for the owner's public websites.
// Returns only display fields; notes and owner data are never exposed.
export const Route = createFileRoute("/api/public/apps")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: cors }),
      GET: async ({ request }) => {
        const siteUrl = new URL(request.url).searchParams.get("site") ?? "";
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const norm = (u: string | null) => (u ?? "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");

        const { data: sites } = await supabaseAdmin.from("sites").select("id, title, url");
        const site = (sites ?? []).find((s) => siteUrl && norm(s.url) === norm(siteUrl));
        if (!site) return new Response(JSON.stringify({ apps: [] }), { headers: cors });

        const { data: apps } = await supabaseAdmin
          .from("apps")
          .select("*")
          .eq("site_id", site.id)
          .eq("status", "منشور")
          .order("created_at", { ascending: false });

        const out = (apps ?? []).map((a) => publicApp(a, new URL(request.url).origin));
        return new Response(JSON.stringify({ site: site.title, apps: out }), {
          headers: { ...cors, "Cache-Control": "public, max-age=60" },
        });
      },
    },
  },
});
