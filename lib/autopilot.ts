import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';
import {
  assignLeadToUser,
  createFollowUpReminder,
  createLeadPipelineActivity,
  ensureConversationForLead,
  normalizeLeadStatus,
  runLeadAutomation,
} from '@/lib/business-ops';

/**
 * 🧠 AUTOPILOTO — "Cerebro" de operaciones.
 * Recibe una instrucción en lenguaje natural, consulta el estado real de la
 * operación y devuelve un plan JSON con acciones concretas que se ejecutan
 * contra la base de datos (asignar, mover etapa, recordar, agendar, correr
 * la automatización). Usa la misma cadena de proveedores LLM que Sophie.
 */

type AutopilotAction =
  | { action: 'assign'; leadId: string; userId: string; reason?: string }
  | { action: 'move_stage'; leadId: string; status: string; reason?: string }
  | { action: 'remind'; leadId: string; scheduledFor?: string; message?: string }
  | { action: 'book'; leadId: string; fechaHora?: string; notes?: string }
  | { action: 'whatsapp'; leadId: string; message: string }
  | { action: 'answer'; text: string }
  | { action: 'run_automation'; limit?: number };

export type AutopilotPlan = {
  summary: string;
  actions: AutopilotAction[];
};

export type AutopilotStepResult = {
  action: AutopilotAction['action'];
  target?: string;
  ok: boolean;
  detail: string;
};

const SYSTEM_PROMPT = `Eres el cerebro operativo ("Autopiloto") de un Business OS para tiendas/clínicas.
Recibes: (1) la instrucción del dueño, (2) el estado real de leads, agentes y citas.
Debes responder SOLO con JSON válido (sin markdown, sin texto extra) con esta forma:
{
  "summary": "explicación de 1-2 frases en español de lo que vas a hacer",
  "actions": [
    { "action": "assign", "leadId": "...", "userId": "...", "reason": "..." },
    { "action": "move_stage", "leadId": "...", "status": "CONTACTED|APPOINTMENT_BOOKED|FOLLOW_UP|CLOSED_WON|CLOSED_LOST", "reason": "..." },
    { "action": "remind", "leadId": "...", "scheduledFor": "ISO fecha futura", "message": "mensaje corto en español" },
    { "action": "book", "leadId": "...", "fechaHora": "ISO fecha futura", "notes": "..." },
    { "action": "whatsapp", "leadId": "...", "message": "mensaje para enviar por WhatsApp real" },
    { "action": "answer", "text": "respuesta directa a una pregunta del dueño, sin ejecutar acciones" },
    { "action": "run_automation", "limit": 50 }
  ]
}
REGLAS:
- Usa SOLO los leadId y userId de la lista de contexto. NUNCA inventes IDs.
- Máximo 20 acciones. Si la instrucción es ambigua, elige la interpretación más útil y explícala en summary.
- Si no hay nada que hacer, responde { "summary": "...", "actions": [] }.
- scheduledFor/fechaHora siempre ISO 8601 en el futuro (máximo +7 días).
- El mensaje de remind debe sonar humano y servir para WhatsApp.
- Si la instrucción es una PREGUNTA (¿cuántos…?, ¿qué…?, ¿quiénes…?, ¿cuándo…?), responde con UNA sola acción {"action":"answer","text":"respuesta clara en español usando los datos del contexto"} y NO ejecutes otras acciones. Usa cifras concretas del contexto.
- Usa "whatsapp" SOLO cuando el dueño pida explícitamente enviar/escribir/mensajear al lead. El mensaje debe sonar humano, breve y sin emojis excesivos.`;

function buildProviders() {
  const make = (name: string, apiKey: string | undefined, baseURL: string, model: string) => ({
    name,
    model,
    client: apiKey ? new OpenAI({ apiKey, baseURL }) : null,
  });
  return [
    make('Groq 🚀', process.env.GROQ_API_KEY, 'https://api.groq.com/openai/v1', 'openai/gpt-oss-20b'),
    make('SambaNova ⚡', process.env.SAMBANOVA_API_KEY, 'https://api.sambanova.ai/v1', 'Meta-Llama-3.1-8B-Instruct'),
    make('Mistral 🔥', process.env.MISTRAL_API_KEY, 'https://api.mistral.ai/v1', 'mistral-small-latest'),
    make('OpenRouter 🃏', process.env.OPENROUTER_API_KEY, 'https://openrouter.ai/api/v1', 'openrouter/free'),
    make(
      'Kimi ✨',
      process.env.KIMI_API_KEY,
      process.env.KIMI_API_URL || 'https://api.moonshot.ai/v1',
      process.env.KIMI_MODEL || 'moonshot-v1-8k'
    ),
    make('Cerebras ⚡', process.env.CEREBRAS_API_KEY, 'https://api.cerebras.ai/v1', 'llama-3.3-70b'),
  ];
}

/** Contexto que se envía al LLM: estado real de la operación. */
async function buildContext(tiendaId: string) {
  const [leads, users, appointments, automation] = await Promise.all([
    prisma.lead.findMany({
      where: { tiendaId },
      include: {
        assignedTo: { select: { id: true, name: true } },
        appointments: { orderBy: { fechaHora: 'asc' as const }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.user.findMany({
      where: { tiendas: { some: { id: tiendaId } } },
      select: { id: true, name: true, email: true },
      take: 20,
    }),
    prisma.cita.findMany({
      where: { tiendaId, fechaHora: { gte: new Date() } },
      orderBy: { fechaHora: 'asc' },
      take: 10,
    }),
    prisma.leadReminder.count({ where: { status: 'PENDING', scheduledFor: { lte: new Date() }, lead: { tiendaId } } }),
  ]);

  const leadLines = leads.map((lead) => {
    const appt = lead.appointments?.[0];
    return [
      `leadId=${lead.id}`,
      `nombre="${lead.nombre ?? 'Sin nombre'}"`,
      `estado=${lead.estado}`,
      `telefono=${lead.phone ?? '-'}`,
      `agente=${lead.assignedTo ? `${lead.assignedTo.id} (${lead.assignedTo.name ?? 'sin nombre'})` : 'SIN_ASIGNAR'}`,
      `ultimoContacto=${lead.lastContactAt?.toISOString() ?? 'nunca'}`,
      appt ? `citaProxima=${appt.fechaHora.toISOString()}` : 'citaProxima=ninguna',
    ].join(' | ');
  });

  const userLines = users.map((u) => `userId=${u.id} | nombre="${u.name ?? u.email ?? 'Usuario'}"`);
  const apptLines = appointments.map((a) => `cita=${a.id} | cliente="${a.clienteNombre}" | ${a.fechaHora.toISOString()} | ${a.estado}`);

  return [
    `TIENDA: ${tiendaId}`,
    `AGENTES DISPONIBLES:\n${userLines.join('\n') || '(sin agentes)'}`,
    `LEADS (recientes, máx 30):\n${leadLines.join('\n') || '(sin leads)'}`,
    `CITAS PRÓXIMAS:\n${apptLines.join('\n') || '(sin citas)'}`,
    `RECORDATORIOS VENCIDOS: ${automation}`,
    `FECHA ACTUAL: ${new Date().toISOString()}`,
  ].join('\n\n');
}

/** Extrae el JSON de la respuesta del LLM (tolera bloques ```json). */
function extractJson(text: string): AutopilotPlan | null {
  const cleaned = text.replace(/```json/gi, '```').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Partial<AutopilotPlan>;
    if (!Array.isArray(parsed.actions)) return null;
    return {
      summary: typeof parsed.summary === 'string' ? parsed.summary : 'Plan generado.',
      actions: parsed.actions.filter(
        (a) => a && typeof a === 'object' && typeof (a as AutopilotAction).action === 'string'
      ) as AutopilotAction[],
    };
  } catch {
    return null;
  }
}

async function planWithLlm(instruction: string, context: string): Promise<{ plan: AutopilotPlan; provider: string } | null> {
  for (const provider of buildProviders()) {
    if (!provider.client) continue;
    try {
      const completion = await Promise.race([
        provider.client.chat.completions.create({
          model: provider.model,
          temperature: 0.2,
          max_tokens: 1600,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `INSTRUCCIÓN DEL DUEÑO:\n${instruction}\n\nESTADO DE LA OPERACIÓN:\n${context}` },
          ],
        }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
      ]);
      const text = completion.choices?.[0]?.message?.content ?? '';
      const plan = extractJson(text);
      if (plan) return { plan, provider: provider.name };
    } catch (error) {
      console.warn(`[autopilot] proveedor ${provider.name} falló:`, error instanceof Error ? error.message : error);
    }
  }
  return null;
}

/** Validación de seguridad: el lead debe pertenecer a la tienda del dueño. */
async function assertLeadInTienda(leadId: string, tiendaId: string) {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true, tiendaId: true, nombre: true, phone: true } });
  if (!lead || lead.tiendaId !== tiendaId) throw new Error('Lead fuera de tu tienda');
  return lead;
}

/** Ejecuta el plan acción por acción, con tolerancia a fallos individuales. */
async function executePlan(plan: AutopilotPlan, tiendaId: string): Promise<AutopilotStepResult[]> {
  const results: AutopilotStepResult[] = [];
  const actions = plan.actions.slice(0, 20);
  const validUserIds = new Set(
    (await prisma.user.findMany({ where: { tiendas: { some: { id: tiendaId } } }, select: { id: true } })).map((u) => u.id)
  );

  for (const step of actions) {
    try {
      switch (step.action) {
        case 'assign': {
          if (!validUserIds.has(step.userId)) throw new Error('Agente no pertenece a tu tienda');
          const lead = await assertLeadInTienda(step.leadId, tiendaId);
          await assignLeadToUser({ leadId: step.leadId, userId: step.userId, reason: step.reason ?? 'Asignado por el Autopiloto' });
          results.push({ action: 'assign', target: lead.nombre ?? step.leadId, ok: true, detail: 'Lead asignado' });
          break;
        }
        case 'move_stage': {
          const lead = await assertLeadInTienda(step.leadId, tiendaId);
          const status = normalizeLeadStatus(step.status);
          await prisma.lead.update({ where: { id: step.leadId }, data: { estado: status } });
          await createLeadPipelineActivity({
            leadId: step.leadId,
            type: 'STATUS_CHANGED' as never,
            summary: step.reason ?? `Autopiloto: movido a ${status}`,
            metadata: { status, source: 'autopilot' },
          });
          results.push({ action: 'move_stage', target: lead.nombre ?? step.leadId, ok: true, detail: `Etapa → ${status}` });
          break;
        }
        case 'remind': {
          const lead = await assertLeadInTienda(step.leadId, tiendaId);
          const scheduledFor = step.scheduledFor ? new Date(step.scheduledFor) : new Date(Date.now() + 60 * 60 * 1000);
          if (Number.isNaN(scheduledFor.getTime()) || scheduledFor.getTime() < Date.now() - 60000) {
            throw new Error('Fecha de recordatorio inválida');
          }
          await createFollowUpReminder({
            leadId: step.leadId,
            scheduledFor,
            message: step.message ?? 'Seguimiento automático del Autopiloto.',
            channel: 'whatsapp',
          });
          results.push({ action: 'remind', target: lead.nombre ?? step.leadId, ok: true, detail: `Recordatorio ${scheduledFor.toISOString()}` });
          break;
        }
        case 'book': {
          const lead = await assertLeadInTienda(step.leadId, tiendaId);
          const fechaHora = step.fechaHora ? new Date(step.fechaHora) : new Date(Date.now() + 24 * 60 * 60 * 1000);
          if (Number.isNaN(fechaHora.getTime()) || fechaHora.getTime() < Date.now()) {
            throw new Error('Fecha de cita inválida');
          }
          const cita = await prisma.cita.create({
            data: {
              tiendaId,
              leadId: step.leadId,
              clienteNombre: lead.nombre ?? 'Cliente',
              clienteTelefono: lead.phone ?? '',
              fechaHora,
              notes: step.notes ?? 'Cita agendada por el Autopiloto',
              source: 'autopilot',
            },
          });
          results.push({ action: 'book', target: lead.nombre ?? step.leadId, ok: true, detail: `Cita ${fechaHora.toISOString()}` });
          void cita;
          break;
        }
        case 'whatsapp': {
          const lead = await assertLeadInTienda(step.leadId, tiendaId);
          if (!lead.phone) throw new Error('El lead no tiene teléfono');
          const tiendaRecord = await prisma.tienda.findUnique({
            where: { id: tiendaId },
            select: { metaPhoneNumberId: true, metaAccessToken: true, isWhatsAppActive: true },
          });
          if (!tiendaRecord?.isWhatsAppActive || !tiendaRecord.metaPhoneNumberId || !tiendaRecord.metaAccessToken) {
            throw new Error('WhatsApp no está activo para esta tienda (conecta Meta en activación)');
          }
          const { enviarMensajePorWhatsApp } = await import('@/lib/whatsapp');
          const conversation = await ensureConversationForLead({
            tiendaId,
            leadId: lead.id,
            clientPhone: lead.phone,
            clientName: lead.nombre ?? null,
          });
          if (!conversation) throw new Error('No se pudo abrir la conversación');
          const metaMessageId = await enviarMensajePorWhatsApp(lead.phone, step.message, tiendaRecord.metaPhoneNumberId, tiendaRecord.metaAccessToken);
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              metaMessageId,
              senderRole: 'AI',
              direction: 'OUTBOUND',
              messageType: 'text',
              content: step.message,
              status: metaMessageId ? 'SENT' : 'FAILED',
            },
          });
          await createLeadPipelineActivity({
            leadId: lead.id,
            type: 'MESSAGE_SENT' as never,
            summary: `Autopiloto: mensaje de WhatsApp enviado`,
            metadata: { source: 'autopilot', metaMessageId },
          });
          results.push({ action: 'whatsapp', target: lead.nombre ?? lead.phone, ok: Boolean(metaMessageId), detail: metaMessageId ? 'Mensaje enviado por WhatsApp' : 'Meta no devolvió ID de mensaje (posible fallo)' });
          break;
        }
        case 'answer': {
          results.push({ action: 'answer', ok: true, detail: step.text ?? 'Sin respuesta' });
          break;
        }
        case 'run_automation': {
          const result = await runLeadAutomation({ tiendaId, limit: Math.min(step.limit ?? 50, 100) });
          results.push({
            action: 'run_automation',
            ok: true,
            detail: `Automatización: ${result.processed} procesados, ${result.transformedLeads} avanzados, ${result.createdFollowUps} seguimientos`,
          });
          break;
        }
        default:
          results.push({ action: (step as { action: string }).action as AutopilotAction['action'], ok: false, detail: 'Acción desconocida' });
      }
    } catch (error) {
      results.push({
        action: (step as { action: string }).action as AutopilotAction['action'],
        target: (step as { leadId?: string }).leadId,
        ok: false,
        detail: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }

  return results;
}

export async function runAutopilot(params: { instruction: string; tiendaId: string }) {
  const instruction = params.instruction.trim().slice(0, 2000);
  if (!instruction) throw new Error('La instrucción está vacía');

  const context = await buildContext(params.tiendaId);
  const planned = await planWithLlm(instruction, context);

  if (!planned) {
    return {
      ok: false as const,
      error: 'Ningún cerebro está disponible ahora mismo. Revisa las API keys de los LLM (Groq, Kimi, Gemini…).',
    };
  }

  // Modo "solo plan": si la instrucción pide revisión, no ejecuta nada.
  const readOnly = /^(qué|que|revisa|revisa|di|dime|muestra|analiza)/i.test(instruction) && planned.plan.actions.length > 0 && /no ejecutes|solo dime|solo analiza/i.test(instruction);
  const results = readOnly ? [] : await executePlan(planned.plan, params.tiendaId);

  return {
    ok: true as const,
    summary: planned.plan.summary,
    provider: planned.provider,
    results,
  };
}
