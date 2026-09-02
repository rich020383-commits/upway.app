import { buildHealthQuery } from '@/lib/health/data';

export default function HealthFaqPage() {
  const query = buildHealthQuery({ organizationId: 'org-1', clinicId: 'clinic-1', role: 'support-agent' }, 'faq');

  const faqs = [
    { question: '¿Cuánto tarda la respuesta?', answer: 'En promedio, entre 30 y 90 segundos para consultas urgentes y 2 a 4 minutos para seguimientos.' },
    { question: '¿El agente puede agendar?', answer: 'Sí, siempre que la solicitud no requiera valoración humana o aprobación clínica.' },
    { question: '¿Qué pasa si el paciente no puede asistir?', answer: 'Se activa la política de cancelación con recordatorio y reprogramación asistida.' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-slate-500">FAQ</div>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-slate-900">Base de conocimiento</h1>
      </div>

      <div className="grid gap-4">
        {faqs.map((item) => (
          <div key={item.question} className="upway-surface rounded-[24px] p-5">
            <div className="mb-2 text-lg font-black tracking-[-0.04em] text-slate-900">{item.question}</div>
            <p className="text-sm leading-7 text-slate-600">{item.answer}</p>
          </div>
        ))}
      </div>

      <div className="upway-surface rounded-[28px] p-5">
        <div className="mb-3 text-lg font-black tracking-[-0.04em] text-slate-900">Query base</div>
        <pre className="overflow-x-auto rounded-2xl bg-slate-900 p-4 text-sm text-slate-100">{JSON.stringify(query, null, 2)}</pre>
      </div>
    </div>
  );
}
