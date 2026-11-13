import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { licenseInfo, requestLicense } from "@/lib/licenses.functions";

export const Route = createFileRoute("/license")({ head: () => ({ meta: [{ title: "UGC 21 — طلب ترخيص المحتوى" }, { name: "description", content: "طلب ترخيص تطبيق أو كتاب وتنزيل المحتوى بعد الموافقة." }, { property: "og:title", content: "UGC 21 — ترخيص التطبيقات والكتب" }, { property: "og:description", content: "طلب ترخيص وتنزيل المحتوى المرخّص." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" }] }), component: LicensePage });
function LicensePage() {
  const info = useServerFn(licenseInfo); const submit = useServerFn(requestLicense);
  const [appId, setAppId] = useState(""); const [title, setTitle] = useState(""); const [token, setToken] = useState(""); const [message, setMessage] = useState(""); const [sent, setSent] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => { const id = new URL(window.location.href).searchParams.get("app") ?? ""; setAppId(id); info({ data: { appId: id } }).then(r => { setTitle(r.title); setToken(r.token); }).catch(() => setMessage("هذا المحتوى غير متاح للترخيص")); }, [info]);
  const input = "w-full rounded-md border bg-input/40 px-3 py-2 text-sm";
  return <main dir="rtl" className="min-h-screen bg-background px-5 py-12"><div className="mx-auto max-w-lg space-y-8"><h1 className="text-2xl font-bold text-primary">UGC 21 — ترخيص المحتوى</h1><h2 className="text-xl">{title}</h2>
    {token && !sent && <form className="space-y-4" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true); try { await submit({ data: { token, name: String(f.get("name")), contact: String(f.get("contact")) } }); setSent(true); setMessage("تم إرسال طلبك؛ سيصلك كود الترخيص بعد موافقة صاحب الموقع عبر بيانات التواصل التي أدخلتها"); } catch (e) { setMessage(e instanceof Error ? e.message : "تعذّر الإرسال"); } finally { setBusy(false); } }}><label className="block space-y-1">الاسم<input name="name" required minLength={2} maxLength={100} className={input} /></label><label className="block space-y-1">البريد أو رقم التواصل<input name="contact" required minLength={5} maxLength={200} className={input} /></label><Button disabled={busy}><Send /> إرسال طلب الترخيص</Button></form>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {token && <form className="space-y-3 border-t pt-6" action="/api/public/app-media" method="get"><input name="id" type="hidden" value={appId} /><input name="download" type="hidden" value="1" /><label className="block space-y-1">كود الترخيص<input name="license" required autoComplete="off" dir="ltr" className={input} /></label><Button variant="outline"><Download /> تنزيل المحتوى</Button></form>}
  </div></main>;
}