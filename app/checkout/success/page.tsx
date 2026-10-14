import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const params = await searchParams;
  const sessionParam = params.session_id;
  const sessionId = Array.isArray(sessionParam) ? sessionParam[0] : sessionParam;

  const continueHref = sessionId
    ? `/subscription?session_id=${encodeURIComponent(sessionId)}`
    : "/subscription";

  return (
    <main className="min-h-screen bg-[#A5C9E9] bg-linear-to-b from-[#A5C9E9] to-[#D1B3FF] px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-3xl overflow-hidden rounded-4xl border border-white/60 bg-white shadow-2xl shadow-slate-300/60">
        <div className="relative overflow-hidden bg-linear-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 text-white sm:p-10">
          <div className="absolute -right-16 -top-12 h-52 w-52 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-white/15 blur-2xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ring-1 ring-white/30">
              <ShieldCheck size={14} /> Stripe verified
            </div>
            <h1 className="mt-4 text-3xl font-black sm:text-4xl">Payment successful</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:text-base">
              Your checkout is complete. Continue to refresh your subscription access and unlock premium features.
            </p>
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-emerald-900">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <h2 className="text-lg font-black">Transaction confirmed</h2>
                <p className="mt-1 text-sm leading-6 text-emerald-800/90">
                  We received Stripe confirmation. Use the button below to continue.
                </p>
              </div>
            </div>
          </div>

          <Link
            href={continueHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#4F84F4] to-[#9A39E8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition-all hover:opacity-95"
          >
            Continue to subscription
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
}