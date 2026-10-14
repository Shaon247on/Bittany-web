import Link from "next/link";
import { CheckCircle2, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";

type WalletSuccessPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function WalletSuccessPage({ searchParams }: WalletSuccessPageProps) {
  const params = await searchParams;
  const sessionParam = params.session_id;
  const sessionId = Array.isArray(sessionParam) ? sessionParam[0] : sessionParam;

  const targetHref = sessionId
    ? `/settings/wallet?session_id=${encodeURIComponent(sessionId)}`
    : "/settings/wallet";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#A5C9E9] bg-linear-to-b from-[#A5C9E9] to-[#D1B3FF] px-4 py-10 sm:px-6">
      <section className="w-full max-w-2xl overflow-hidden rounded-4xl border border-white/60 bg-white shadow-2xl shadow-slate-300/60">
        <div className="relative overflow-hidden bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white sm:p-10">
          <div className="absolute -right-16 -top-12 h-52 w-52 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-white/15 blur-2xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ring-1 ring-white/30">
              <ShieldCheck size={14} /> Stripe verified
            </div>
            <h1 className="mt-4 text-3xl font-black sm:text-4xl">Wallet top-up successful</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
              Your payment completed successfully. We&apos;re taking you back to your wallet so the latest balance can load.
            </p>
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <h2 className="text-lg font-black">Top-up confirmed</h2>
                <p className="mt-1 text-sm leading-6 text-emerald-800/90">
                  The Stripe session was completed. Your wallet page will refresh automatically.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Session ID</p>
            <p className="mt-2 break-all text-sm font-medium text-slate-700">
              {sessionId ?? "No session id was provided in the URL."}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={targetHref}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#4F84F4] to-[#9A39E8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition-all hover:opacity-95"
            >
              Continue to wallet
              <ArrowRight size={16} />
            </Link>
            <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600">
              <Loader2 size={16} className="animate-spin text-sky-500" />
              Returning automatically
            </div>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `setTimeout(function () { window.location.replace(${JSON.stringify(targetHref)}); }, 2500);`,
          }}
        />
      </section>
    </main>
  );
}