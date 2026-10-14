import Link from "next/link";
import { ArrowRight, RefreshCcw, ShieldAlert } from "lucide-react";

const targetHref = "/settings/wallet";

export default function WalletCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#A5C9E9] bg-linear-to-b from-[#A5C9E9] to-[#D1B3FF] px-4 py-10 sm:px-6">
      <section className="w-full max-w-2xl overflow-hidden rounded-4xl border border-white/60 bg-white shadow-2xl shadow-slate-300/60">
        <div className="relative overflow-hidden bg-linear-to-r from-amber-500 via-orange-500 to-rose-500 p-8 text-white sm:p-10">
          <div className="absolute -right-16 -top-12 h-52 w-52 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-white/15 blur-2xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ring-1 ring-white/30">
              <ShieldAlert size={14} /> Checkout canceled
            </div>
            <h1 className="mt-4 text-3xl font-black sm:text-4xl">No charge was made</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/90 sm:text-base">
              The payment flow was canceled. You can return to your wallet page and try again whenever you&apos;re ready.
            </p>
          </div>
        </div>

        <div className="space-y-6 p-6 sm:p-8">
          <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-amber-900">
            <div className="flex items-start gap-3">
              <RefreshCcw className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <h2 className="text-lg font-black">Checkout stopped</h2>
                <p className="mt-1 text-sm leading-6 text-amber-800/90">
                  Your wallet balance was not changed. We&apos;re sending you back to the wallet page now.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={targetHref}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-[#4F84F4] to-[#9A39E8] px-5 py-3 text-sm font-black text-white shadow-lg shadow-sky-100 transition-all hover:opacity-95"
            >
              Back to wallet
              <ArrowRight size={16} />
            </Link>
            <div className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600">
              Redirecting automatically
            </div>
          </div>
        </div>

        <script
          dangerouslySetInnerHTML={{
            __html: `setTimeout(function () { window.location.replace(${JSON.stringify(targetHref)}); }, 2000);`,
          }}
        />
      </section>
    </main>
  );
}