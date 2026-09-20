"use client";

import { useEffect, useState } from 'react';
import { BadgeCheck, Loader2, ShieldAlert, ShieldCheck, Upload } from 'lucide-react';

type Record = {
  id: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
  birthDate: string;
  sexCode: string;
  municipalityCode: string;
  departmentCode: string;
  phoneE164: string | null;
  conforming: boolean;
  completenessPct: number;
  confirmedAt: string | null;
  lastConfirmation: { method: string; confirmedAt: string } | null;
  handoff: { targetSystem: string; status: string } | null;
  integrityOk: boolean;
  createdAt: string;
};

type Kpis = {
  total: number;
  conformingPct: number;
  confirmedPct: number;
  delivered: number;
  tampered: number;
  avgCompletenessPct: number;
};

export default function HealthIdentityConsolePage() {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/health/identity/console');
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error ?? 'Error cargando la consola');
          return;
        }
        setKpis(data.kpis ?? null);
        setRecords(data.records ?? []);
      } catch (err) {
        console.error('Error cargando consola de identidad:', err);
        setError('Error de conexion al cargar la consola');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Cargando consola de certificacion...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const slaCards = [
    { label: 'Identidades certificadas', value: kpis?.total ?? 0 },
    { label: '% Conforme', value: `${kpis?.conformingPct ?? 0}%`, ok: (kpis?.conformingPct ?? 0) >= 98 },
    { label: '% Confirmado por paciente', value: `${kpis?.confirmedPct ?? 0}%`, ok: (kpis?.confirmedPct ?? 0) >= 95 },
    { label: '% Completitud media', value: `${kpis?.avgCompletenessPct ?? 0}%`, ok: (kpis?.avgCompletenessPct ?? 0) >= 95 },
    { label: 'Entregas al HIS', value: kpis?.delivered ?? 0 },
    { label: 'Registros alterados', value: kpis?.tampered ?? 0, danger: (kpis?.tampered ?? 0) > 0 },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
          <BadgeCheck className="h-6 w-6 text-emerald-600" />
          Consola de Identidad Conforme
        </h1>
        <p className="text-sm text-slate-500">
          Evidencia del modulo Identidad Conforme: % conforme, confirmacion del paciente,
          entregas al HIS e integridad (hash) de cada registro.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {slaCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-2xl border p-4 ${
              card.danger
                ? 'border-red-200 bg-red-50'
                : card.ok === false
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Paciente</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Nacimiento</th>
              <th className="px-4 py-3">Sexo / Municipio</th>
              <th className="px-4 py-3">Conformidad</th>
              <th className="px-4 py-3">Confirmacion</th>
              <th className="px-4 py-3">Entrega HIS</th>
              <th className="px-4 py-3">Integridad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                  Aun no hay identidades certificadas. Se generan cuando el agente de voz
                  agenda una cita con datos conformes.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{r.fullName}</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.documentType} {r.documentNumber}
                </td>
                <td className="px-4 py-3 text-slate-600">{r.birthDate}</td>
                <td className="px-4 py-3 text-slate-600">
                  {r.sexCode} · {r.departmentCode}-{r.municipalityCode}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                      r.conforming ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {r.conforming ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                    {r.completenessPct}%
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {r.lastConfirmation
                    ? new Date(r.lastConfirmation.confirmedAt).toLocaleDateString('es-CO')
                    : 'Pendiente'}
                </td>
                <td className="px-4 py-3">
                  {r.handoff ? (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
                      <Upload className="h-3.5 w-3.5" />
                      {r.handoff.targetSystem}: {r.handoff.status}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">Sin entrega</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {r.integrityOk ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="text-xs text-slate-400">
        La columna de integridad recalcula el hash sha256 del registro contra lo almacenado.
        Un alerta rojo significa que la fila fue modificada fuera del flujo conforme.
      </p>
    </div>
  );
}
