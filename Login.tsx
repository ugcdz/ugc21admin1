import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { prepareOwnerLogin, OWNER_EMAIL } from "@/lib/owner.functions";

export function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLoading(true);
    setError("");
    const password = String(f.get("password"));
    try {
      const res = await prepareOwnerLogin({ data: { password } });
      if (!res.ok) throw new Error();
      const { error } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password });
      if (error) throw error;
    } catch {
      setError("كلمة المرور غير صحيحة");
    }
    setLoading(false);
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center cyber-grid px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5 rounded-xl border bg-card p-8 glow">
        <div className="flex flex-col items-center gap-2 text-center">
          <ShieldCheck className="h-10 w-10 text-primary" />
          <h1 className="font-mono text-2xl font-bold tracking-wider">UGC 21</h1>
          <p className="text-sm text-muted-foreground">منطقة خاصة — الدخول للمالك فقط</p>
        </div>
        <input name="password" type="password" required placeholder="كلمة المرور" dir="ltr"
          className="w-full rounded-md border bg-input/40 px-3 py-2 outline-none focus:ring-2 focus:ring-ring" />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button disabled={loading}
          className="w-full rounded-md bg-primary py-2 font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
          {loading ? "جارٍ الدخول..." : "دخول"}
        </button>
      </form>
    </div>
  );
}
