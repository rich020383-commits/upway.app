import { describe, expect, it } from 'vitest';
import {
  availabilitySpoken,
  bookingConfirmedSpoken,
  cancelledSpoken,
  holdExpiredSpoken,
  holdSpoken,
  missingDataSpoken,
  noAvailabilitySpoken,
  rescheduledSpoken,
  slotUnavailableSpoken,
  spokenListOfAppointments,
  statusSpoken,
  waitlistOfferSpoken,
  waitlistSpoken,
} from '@/lib/agenda/voice-responses';

const BOGOTA = 'America/Bogota';
const SLOT_0900 = new Date('2026-09-21T14:00:00.000Z'); // 09:00 en Bogotá

function slot(startLabel: string) {
  return {
    start: SLOT_0900,
    startLabel,
    endLabel: startLabel,
  };
}

describe('agenda/voz · disponibilidad', () => {
  it('ofrece los horarios con el nombre del servicio y del profesional', () => {
    const speak = availabilitySpoken({
      serviceName: 'Consulta general',
      dateKeyLabel: 'lunes, 21 de septiembre',
      timeZone: BOGOTA,
      slots: [slot('09:00'), slot('09:30'), slot('10:00')],
      resourceName: 'Dra. Mara',
    });

    expect(speak).toContain('Consulta general');
    expect(speak).toContain('Dra. Mara');
    expect(speak).toContain('09:00');
    expect(speak).toContain('y 10:00');
    expect(speak).toContain('¿Cuál le sirve?');
  });

  it('avisa cuántos horarios más hay cuando la lista es larga', () => {
    const speak = availabilitySpoken({
      serviceName: 'Terapia',
      dateKeyLabel: 'lunes, 21 de septiembre',
      timeZone: BOGOTA,
      slots: [slot('09:00'), slot('09:30'), slot('10:00'), slot('10:30'), slot('11:00')],
      maxOffered: 3,
    });

    expect(speak).toContain('Hay 2 horarios más');
  });

  it('sin cupos ofrece el día más cercano o lista de espera', () => {
    const speak = availabilitySpoken({
      serviceName: 'Consulta general',
      dateKeyLabel: 'domingo, 20 de septiembre',
      timeZone: BOGOTA,
      slots: [],
    });

    expect(speak).toContain('No tengo cupos');
    expect(speak).toContain('lista de espera');
    expect(noAvailabilitySpoken({ serviceName: 'X', dateKeyLabel: 'hoy' })).toContain('No tengo cupos');
  });
});

describe('agenda/voz · holds y reserva', () => {
  it('explica el cupo apartado y cuánto lo retiene', () => {
    const speak = holdSpoken({
      slotStart: SLOT_0900,
      timeZone: BOGOTA,
      serviceName: 'Consulta general',
      holdMinutes: 10,
      resourceName: 'Dra. Mara',
    });

    expect(speak).toContain('Le aparto');
    expect(speak).toContain('a las 09:00');
    expect(speak).toContain('10 minutos');
  });

  it('confirma la cita mencionando el correo cuando lo hay', () => {
    const conCorreo = bookingConfirmedSpoken({
      slotStart: SLOT_0900,
      timeZone: BOGOTA,
      serviceName: 'Consulta general',
      resourceName: 'Dra. Mara',
      emailSentTo: 'paciente@correo.com',
    });
    expect(conCorreo).toContain('quedó agendada');
    expect(conCorreo).toContain('paciente@correo.com');

    const sinCorreo = bookingConfirmedSpoken({
      slotStart: SLOT_0900,
      timeZone: BOGOTA,
      serviceName: 'Consulta general',
    });
    expect(sinCorreo).toContain('por correo');
  });

  it('avisa cuando el cupo se ocupó o el hold venció', () => {
    expect(slotUnavailableSpoken()).toContain('acaba de ocuparse');
    expect(holdExpiredSpoken()).toContain('se liberó');
  });

  it('confirma reprogramación y cancelación', () => {
    const reprogramada = rescheduledSpoken({
      slotStart: SLOT_0900,
      timeZone: BOGOTA,
      serviceName: 'Consulta general',
    });
    expect(reprogramada).toContain('reprogramada');
    expect(reprogramada).toContain('a las 09:00');

    expect(cancelledSpoken({ serviceName: 'Consulta general' })).toContain('Cancelé su Consulta general');
    expect(cancelledSpoken({ serviceName: 'Consulta general', slotLabel: 'lunes 21' })).toContain('del lunes 21');
  });
});

describe('agenda/voz · lista de espera y consultas', () => {
  it('informa la posición en la lista', () => {
    const speak = waitlistSpoken({ serviceName: 'Consulta general', position: 3 });
    expect(speak).toContain('lista de espera');
    expect(speak).toContain('turno 3');
  });

  it('ofrece un cupo liberado con su vigencia', () => {
    const speak = waitlistOfferSpoken({
      slotStart: SLOT_0900,
      timeZone: BOGOTA,
      serviceName: 'Consulta general',
      expiresInMinutes: 10,
    });

    expect(speak).toContain('Se liberó un cupo');
    expect(speak).toContain('a las 09:00');
    expect(speak).toContain('10 minutos');
  });

  it('lista las citas del paciente o pide agendar', () => {
    const vacio = spokenListOfAppointments([], BOGOTA);
    expect(vacio).toContain('No encontré citas');

    const dos = spokenListOfAppointments(
      [
        { slotStart: SLOT_0900, serviceName: 'Consulta general', status: 'CONFIRMED' },
        { slotStart: SLOT_0900, serviceName: 'Terapia', status: 'PENDING' },
      ],
      BOGOTA
    );
    expect(dos).toContain('2 citas');
    expect(dos).toContain('Terapia');
    expect(dos).toContain('pendiente de confirmar');
  });

  it('pide los datos que faltan y traduce el estado', () => {
    expect(missingDataSpoken('correo')).toContain('correo');
    expect(missingDataSpoken('telefono')).toContain('número de contacto');
    expect(statusSpoken('CONFIRMED')).toBe('La cita quedó confirmada.');
  });
});
