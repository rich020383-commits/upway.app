'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { billingStateMeta, resolveBillingState } from '@/lib/billing/access';

function BillingGateContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const rawState =
    searchParams.get('state') ??
    (session?.user as Record<string, unknown> | undefined)?.accessState ??
    (session?.user as Record<string, unknown> | undefined)?.billingState ??
    'trial';

  const state = resolveBillingState(String(rawState));
  const meta = billingStateMeta[state];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-[32px] border border-slate-200 bg-white/80 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-slate-500">Access control</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-slate-900">Acceso restringido por billing</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          Este workspace está en estado <span className="font-bold text-slate-900">{meta.label}</span> y por eso no puede operar en el panel hasta resolver la condición financiera correspondiente.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">Estado actual</div>
            <div className="mt-3 text-2xl font-black tracking-[-0.05em] text-slate-900">{meta.label}</div>
            <p className="mt-3 text-sm leading-7 text-slate-600">{meta.summary}</p>
          </div>
          <div className="rounded-[28px] border border-[#dfeaff] bg-[#edf4ff] p-5">
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#1b5ed6]">Recomendación</div>
            <div className="mt-3 text-lg font-black tracking-[-0.04em] text-slate-900">
              {meta.requiresCheckout ? 'Pago o revisión' : 'Validación comercial'}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/admin/codigos"
            className="rounded-full bg-[#0f172a] px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Ver códigos de acceso
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Volver al registro / revisión
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-6 py-12 text-slate-600">Cargando acceso…</div>}>
      <BillingGateContent />
    </Suspense>
  );
}
