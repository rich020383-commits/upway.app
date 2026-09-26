'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MicOff, ShieldCheck, TriangleAlert } from 'lucide-react';

type Autorizacion = {
  id: string;
  titular: string;
  proposito: string;
  grantedAt: string;
  revokedAt: string | null;
  revokeReason: string | null;
  tieneClon: boolean;
};

/**
 * Pantalla de revocación de voces clonadas.
 *
 * La ley 1581 da a la persona el derecho a que su voz deje de usarse, así que
 * esto tiene que existir y ser fácil: no una casilla dentro de un panel técnico.
 *
 * Solo lista voces autorizadas por ESTE cliente. El listado sale de la base de
 * datos y no de la API de Telnyx, porque la cuenta de Telnyx es compartida: leer
 * de ahí mostraría las voces de todos los clientes.
 */
export default function VoiceAuthorizations() {
  const [rows, setRows] = useState<Autorizacion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const res = await fetch('/api/voice/authorizations', { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? 'No se pudieron cargar tus voces.');
    return (data.autorizaciones ?? []) as Autorizacion[];
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const lista = await cargar();
        if (alive) setRows(lista);
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : 'No se pudieron cargar tus voces.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [cargar]);

  const revocar = async (row: Autorizacion) => {
    const motivo = window.prompt(
      `¿Revocar la voz autorizada por ${row.titular}?\n\nTu voz dejará de estar disponible para Upway. Esta acción no se puede deshacer.`,
      'Revocada a petición del titular'
    );
    if (motivo === null) return;

    setBusyId(row.id);
    setError(null);
    setOkMsg(null);
    try {
      const res = await fetch('/api/voice/authorizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorizationId: row.id, motivo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? 'No se pudo revocar la voz.');
      setOkMsg(`La voz autorizada por ${row.titular} quedó revocada.`);
      setRows(await cargar());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo revocar la voz.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <p className="text-[15px] text-slate-300 sm:text-sm">
        Cada voz clonada necesita la autorización de la persona cuya voz es. Aquí ves esas
        autorizaciones y puedes revocar cualquiera en el momento.
      </p>


      {okMsg && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-3 text-[13px] font-semibold text-emerald-200">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          {okMsg}
        </p>
      )}
      {error && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-rose-400/40 bg-rose-400/10 p-3 text-[13px] font-semibold text-rose-200">
          <TriangleAlert size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-[13px] text-slate-400">
          <Loader2 size={15} className="animate-spin" /> Cargando…
        </p>
      ) : !rows || rows.length === 0 ? (
        <p className="mt-3 text-[13px] text-slate-500">
          Todavía no hay voces clonadas en tu operación. Cuando clones una, la autorización
          queda registrada aquí.
        </p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.id} className="rounded-xl border border-[#1E293B] bg-[#0D1117] p-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[15px] font-bold text-slate-200 sm:text-sm">{r.titular}</p>
                {r.revokedAt ? (
                  <span className="rounded-full bg-slate-700/40 px-2.5 py-0.5 text-[11px] font-bold text-slate-400">
                    Revocada
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void revocar(r)}
                    disabled={busyId === r.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/50 px-3 py-1.5 text-[11px] font-bold text-rose-200 transition hover:bg-rose-400/10 disabled:opacity-50"
                  >
                    {busyId === r.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <MicOff size={12} />
                    )}
                    Revocar
                  </button>
                )}
              </div>
              <p className="mt-1 text-[13px] text-slate-400">{r.proposito}</p>
              <p className="mt-1 font-mono text-[11px] text-slate-600">
                Autorizada el {new Date(r.grantedAt).toLocaleDateString('es-CO')}
                {r.revokeReason ? ` · ${r.revokeReason}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 flex items-start gap-2 border-t border-[#1E293B] pt-3 text-[12px] leading-relaxed text-slate-500">
        <ShieldCheck size={14} className="mt-0.5 shrink-0" />
        <span>
          Upway guarda la evidencia de cada autorización (hash del audio y de la lectura), no
          el audio. Al revocar, la voz se elimina del servicio y deja de estar disponible.
        </span>
      </p>
    </div>
  );
}
