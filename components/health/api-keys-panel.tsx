"use client";

import { useCallback, useEffect, useState } from 'react';
import { Copy, KeyRound, Loader2, Plus, ShieldOff } from 'lucide-react';

type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

function formatDate(value: string | null): string {
  if (!value) return 'nunca';
  return new Date(value).toLocaleString('es-CO');
}

export function ApiKeysPanel() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [freshKey, setFreshKey] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/api-clients');
      const data = await res.json();
      setKeys(data.clients ?? []);
    } catch (error) {
      console.error('Error cargando llaves de API:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const handleCreate = async () => {
    if (name.trim().length < 2) {
      setFeedback('Ponle un nombre reconocible a la llave (ej. "HIS produccion").');
      return;
    }
    setCreating(true);
    setFeedback(null);
    setFreshKey(null);
    try {
      const res = await fetch('/api/health/api-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setFreshKey(data.key ?? null);
        setName('');
        setFeedback('Llave creada. Copiala ahora: no se puede recuperar.');
        await loadKeys();
      } else {
        setFeedback(data.error ?? 'No se pudo crear la llave.');
      }
    } catch (error) {
      console.error('Error creando llave de API:', error);
      setFeedback('Error de conexion al crear la llave.');
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    setRevokingId(id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/health/api-clients?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback('Llave revocada. Deja de funcionar de inmediato.');
        await loadKeys();
      } else {
        setFeedback(data.error ?? 'No se pudo revocar la llave.');
      }
    } catch (error) {
      console.error('Error revocando llave de API:', error);
      setFeedback('Error de conexion al revocar.');
    } finally {
      setRevokingId(null);
    }
  };

  const copyFreshKey = async () => {
    if (!freshKey) return;
    try {
      await navigator.clipboard.writeText(freshKey);
      setFeedback('Llave copiada al portapapeles.');
    } catch {
      setFeedback('No se pudo copiar: selecciona y copia manualmente.');
    }
  };

  return (
    <div className="upway-surface rounded-[28px] p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-slate-500">
            Integracion
          </div>
          <h2 className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-900">
            Llaves de API para su sistema
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Su HIS/HCE consulta el registro conforme del paciente con una llave propia.
            Cada llave queda atada a esta organizacion: nunca ve datos de otra IPS.
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-slate-900 p-3 text-white">
          <KeyRound className="h-5 w-5" />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder='Nombre de la llave (ej. "HIS produccion")'
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Crear llave
        </button>
      </div>

      {freshKey ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">
            Copiala ahora - no se vuelve a mostrar
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 text-xs font-mono text-slate-800">
              {freshKey}
            </code>
            <button
              type="button"
              onClick={copyFreshKey}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? <p className="text-sm text-slate-600">{feedback}</p> : null}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando llaves...
        </div>
      ) : keys.length === 0 ? (
        <p className="text-sm text-slate-500">
          Todavia no hay llaves. Cree la primera cuando su equipo tecnico este listo para integrar.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {keys.map((key) => (
            <div key={key.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">{key.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] ${
                      key.revokedAt
                        ? 'bg-rose-100 text-rose-700'
                        : key.isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {key.revokedAt ? 'revocada' : key.isActive ? 'activa' : 'inactiva'}
                  </span>
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {key.keyPrefix}... · creada {formatDate(key.createdAt)} · ultimo uso {formatDate(key.lastUsedAt)}
                </div>
              </div>
              {key.revokedAt ? null : (
                <button
                  type="button"
                  onClick={() => handleRevoke(key.id)}
                  disabled={revokingId === key.id}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-50"
                >
                  {revokingId === key.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldOff className="h-3.5 w-3.5" />
                  )}
                  Revocar
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

