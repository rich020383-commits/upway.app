import { NextResponse } from 'next/server';
import { sendHealthOnboardingEmail } from '@/lib/email';

export async function GET() {
  console.log('[test-notify] Iniciando prueba de notificación...');

  const testData = {
    clinicName: 'Clínica Test Upway',
    legalName: 'Clínica Test S.A.S.',
    nit: '900123456-1',
    specialty: 'Medicina general',
    location: 'Bogotá',
    facilityType: 'clinica',
    contactName: 'Juan Pérez',
    contactPhone: '3001234567',
    contactEmail: 'juan@clinicatest.com',
    dailyCalls: '50',
    avgCallMinutes: '4',
    planId: 'clinica-pro-1800',
    preferredAreaCode: '601',
    existingPhone: '',
    crmOrAgenda: 'Google Calendar',
    careModel: 'Triaje asistido',
    schedule: 'L-V 8am-6pm',
    priority: 'high',
    agentName: 'Upway Health Agent',
    mission: 'Atender llamadas y agendar citas',
    triageRules: 'Derivación a urgencias si es prioritario',
    tone: 'Profesional y empático',
    responseStyle: 'Conciso',
    policy: 'No dar diagnósticos',
    cancellationWindow: '2 horas',
    faq: 'Horarios, ubicación, especialidades',
    channel: 'whatsapp',
    webhook: '',
    submittedAt: new Date().toLocaleString('es-CO', {
      timeZone: 'America/Bogota',
      dateStyle: 'long',
      timeStyle: 'short',
    }),
  };

  try {
    const result = await sendHealthOnboardingEmail(testData);
    console.log('[test-notify] Resultado:', result);

    return NextResponse.json({
      ok: result.ok,
      message: result.ok ? 'Notificación enviada' : 'Error en notificación',
      error: result.error,
      testData: {
        clinicName: testData.clinicName,
        nit: testData.nit,
        contactEmail: testData.contactEmail,
      },
    });
  } catch (error) {
    console.error('[test-notify] Error:', error);
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    }, { status: 500 });
  }
}
