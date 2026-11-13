import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Login } from "@/components/admin/Login";
import { Dashboard } from "@/components/admin/Dashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UGC 21 — لوحة الإدارة الخاصة" },
      { name: "description", content: "لوحة خاصة لإدارة المشاريع والمواقع والتطبيقات والأمن السيبراني لـ UGC 21." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "UGC 21 — لوحة الإدارة الخاصة" },
      { property: "og:description", content: "لوحة إدارة خاصة لـ UGC 21." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!ready) return <div className="min-h-screen cyber-grid" />;
  return session ? <Dashboard /> : <Login />;
}
