import { describe, it, expect } from 'vitest';
import {
  buildPatientIdentityData,
  canonicalIdentityPayload,
  identityRecordHash,
  isoDateOnlyFromUtc,
  toDateOnlyUtc,
  verifyIdentityRecordHash,
  IDENTITY_PAYLOAD_VERSION,
  type PatientIdentityData,
} from './persistence';
import { buildConformingIdentity, type ConformingIdentity } from './conformingRecord';

const NOW = new Date('2026-09-19T12:00:00.000Z');

const VALID_INPUT = {
  documentType: 'CC',
  documentNumber: '15802345',
  givenNames: ['Juan', 'Carlos'],
  familyNames: ['Perez', 'Gomez'],
  birthDay: 7,
  birthMonth: 8,
  birthYear: 1971,
  sexCode: 'M',
  municipalityCode: '11001',
} as const;

/** Fixture certificado por el validador real: evita duplicar reglas en los tests. */
function certifiedFixture(overrides: Partial<typeof VALID_INPUT> = {}) {
  const result = buildConformingIdentity({ ...VALID_INPUT, ...overrides }, NOW);
  if (!result.ok) {
    throw new Error(`Fixture invalido en el test: ${JSON.stringify(result.report.issues)}`);
  }
  return result;
}

const SCOPE = { organizationId: 'org_test_1', clinicId: 'clinic_test_1' };

/** Fila persistida + su hash, para las pruebas de integridad. */
function storedRow(overrides: Partial<PatientIdentityData> = {}) {
  const { identity, report } = certifiedFixture();
  const row = { ...buildPatientIdentityData({ scope: SCOPE, identity, report }), ...overrides };
  return { row, hash: row.recordHash };
}

describe('persistence — hash de integridad', () => {
  it('incluye la version del payload canonico', () => {
    expect(IDENTITY_PAYLOAD_VERSION).toBe('v1');
    const { identity } = certifiedFixture();
    expect(canonicalIdentityPayload(identity)).toContain(`"v":"${IDENTITY_PAYLOAD_VERSION}"`);
  });

  it('es determinista: la misma identidad produce el mismo hash', () => {
    const { identity } = certifiedFixture();
    expect(identityRecordHash(identity)).toBe(identityRecordHash(identity));
  });

  it('produce sha256 en hex, no un texto adivinable', () => {
    const { identity } = certifiedFixture();
    const hash = identityRecordHash(identity);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain(identity.documentNumber);
  });

  it('es estable ante mayusculas, minusculas y espacios sobrantes', () => {
    // Ambos lados representan LA MISMA identidad logica: solo cambia el formato
    // con el que llego del canal. Si el hash cambiara, dos capturas identicas
    // producirian evidencia de integridad distinta y la trazabilidad se rompe.
    const { identity } = certifiedFixture();
    const limpio: ConformingIdentity = {
      ...identity,
      documentNumber: identity.documentNumber.toLowerCase(),
      givenNames: ['juan', 'carlos'],
      familyNames: ['perez', 'gomez'],
      email: 'juan@example.com',
      phoneE164: '+573001234567',
    };
    const sucio: ConformingIdentity = {
      ...identity,
      documentNumber: ` ${identity.documentNumber.toUpperCase()} `,
      givenNames: ['  juaN ', 'CARLOS'],
      familyNames: ['PEREZ', '  gomez  '],
      email: '  JUAN@Example.COM ',
      phoneE164: '  +57 300 1234567  ',
    };
    expect(identityRecordHash(sucio)).toBe(identityRecordHash(limpio));
  });

  it('normaliza el telefono igual al construir la fila que al verificar el hash', () => {
    // Regresion: antes el hash se calculaba sobre el input crudo pero se persistia
    // el valor normalizado, asi que un telefono con espacios nunca verificaba.
    const { identity, report } = certifiedFixture();
    const row = buildPatientIdentityData({
      scope: SCOPE,
      identity: { ...identity, phoneE164: '  +57 300 1234567  ' },
      report,
    });
    expect(row.phoneE164).toBe('+573001234567');
    expect(verifyIdentityRecordHash(row, row.recordHash)).toBe(true);
  });

  it('cambia si cambia cualquier campo certificable', () => {
    const { identity } = certifiedFixture();
    const base = identityRecordHash(identity);
    expect(identityRecordHash({ ...identity, sexCode: 'F' })).not.toBe(base);
    expect(identityRecordHash({ ...identity, municipalityCode: '76001' })).not.toBe(base);
    expect(identityRecordHash({ ...identity, birthDate: '1971-08-08' })).not.toBe(base);
    expect(identityRecordHash({ ...identity, documentNumber: '15802346' })).not.toBe(base);
    expect(identityRecordHash({ ...identity, givenNames: ['Juana', 'Carlos'] })).not.toBe(base);
  });

  it('distingue el orden de los componentes del nombre', () => {
    const { identity } = certifiedFixture();
    const invertido = identityRecordHash({ ...identity, givenNames: ['Carlos', 'Juan'] });
    expect(invertido).not.toBe(identityRecordHash(identity));
  });

  it('no mete campos no certificables al hash (edad, nombre del departamento)', () => {
    const { identity } = certifiedFixture();
    const base = identityRecordHash(identity);
    // Se pasa por variable a proposito: son campos que NO forman parte de
    // HashableIdentity, y el punto es que agregarlos no altere la evidencia.
    const conCamposExtra = { ...identity, ageYears: 99, departmentName: 'Otro' };
    expect(identityRecordHash(conCamposExtra)).toBe(base);
  });

  it('representa telefono y correo ausentes como null explicito', () => {
    const { identity } = certifiedFixture();
    const payload = canonicalIdentityPayload({ ...identity, phoneE164: null, email: null });
    expect(payload).toContain('"ph":null');
    expect(payload).toContain('"em":null');
  });
});

describe('persistence — fechas sin corrimiento de zona horaria', () => {
  it('convierte YYYY-MM-DD a medianoche UTC, no a medianoche local', () => {
    const date = toDateOnlyUtc('1971-08-07');
    expect(date.getUTCFullYear()).toBe(1971);
    expect(date.getUTCMonth()).toBe(7); // agosto = indice 7
    expect(date.getUTCDate()).toBe(7);
    expect(date.getUTCHours()).toBe(0);
    expect(date.getUTCMinutes()).toBe(0);
  });

  it('no deriva el dia por zona horaria (bug clasico en UTC-5)', () => {
    const date = toDateOnlyUtc('1990-01-01');
    expect(date.toISOString()).toBe('1990-01-01T00:00:00.000Z');
    expect(isoDateOnlyFromUtc(date)).toBe('1990-01-01');
  });

  it('rechaza formatos que no son YYYY-MM-DD', () => {
    expect(() => toDateOnlyUtc('07/08/1971')).toThrow(/Fecha ISO invalida/);
    expect(() => toDateOnlyUtc('1971-8-7')).toThrow(/Fecha ISO invalida/);
    expect(() => toDateOnlyUtc('')).toThrow(/Fecha ISO invalida/);
  });

  it('rechaza fechas inexistentes en el calendario', () => {
    expect(() => toDateOnlyUtc('2026-02-30')).toThrow(/Fecha ISO inexistente/);
    expect(() => toDateOnlyUtc('2026-13-01')).toThrow(/Fecha ISO inexistente/);
  });

  it('acepta el 29 de febrero en ano bisiesto y rechaza el no bisiesto', () => {
    expect(() => toDateOnlyUtc('2024-02-29')).not.toThrow();
    expect(() => toDateOnlyUtc('2025-02-29')).toThrow(/Fecha ISO inexistente/);
  });

  it('hace round-trip estable Date -> ISO -> Date', () => {
    const original = '1971-08-07';
    expect(isoDateOnlyFromUtc(toDateOnlyUtc(original))).toBe(original);
  });

  it('falla de forma explicita con un Date invalido', () => {
    expect(() => isoDateOnlyFromUtc(new Date('no-es-fecha'))).toThrow(/Fecha invalida/);
  });
});
describe('persistence — mapeo al modelo PatientIdentity', () => {
  it('exige scope de organizacion: nunca persiste identidad sin tenant', () => {
    const { identity, report } = certifiedFixture();
    expect(() =>
      buildPatientIdentityData({ scope: { organizationId: '' }, identity, report })
    ).toThrow(/Falta organizationId/);
  });

  it('se niega a persistir una identidad NO conforme', () => {
    const result = buildConformingIdentity({ ...VALID_INPUT, sexCode: 'X' }, NOW);
    expect(result.ok).toBe(false);
    expect(() =>
      buildPatientIdentityData({ scope: SCOPE, identity: {} as never, report: result.report })
    ).toThrow(/no conforme/);
  });

  it('marca la fila como conforme solo cuando el reporte lo esta', () => {
    const { identity, report } = certifiedFixture();
    const row = buildPatientIdentityData({ scope: SCOPE, identity, report });
    expect(row.conforming).toBe(true);
    expect(row.completenessPct).toBe(100);
    expect(row.issuesJson).toBeNull();
  });

  it('guarda la fecha como Date UTC de solo dia, sin corrimiento', () => {
    const { identity, report } = certifiedFixture();
    const row = buildPatientIdentityData({ scope: SCOPE, identity, report });
    expect(row.birthDate.toISOString()).toBe('1971-08-07T00:00:00.000Z');
  });

  it('normaliza documento y ordena clinicId ausente como null', () => {
    const { identity, report } = certifiedFixture();
    const row = buildPatientIdentityData({
      scope: { organizationId: 'org_x' },
      identity: { ...identity, documentNumber: ' 15802345 ' },
      report,
    });
    expect(row.documentNumber).toBe('15802345');
    expect(row.clinicId).toBeNull();
  });

  it('trata la retencion como TRANSIENT por defecto (minimizacion)', () => {
    const { identity, report } = certifiedFixture();
    const row = buildPatientIdentityData({ scope: SCOPE, identity, report });
    expect(row.retentionMode).toBe('TRANSIENT');
    expect(row.confirmedAt).toBeNull();
  });

  it('respeta la custodia y la fecha de confirmacion cuando se declaran', () => {
    const { identity, report } = certifiedFixture();
    const row = buildPatientIdentityData({
      scope: SCOPE,
      identity,
      report,
      retentionMode: 'CUSTODY',
      confirmedAt: NOW,
    });
    expect(row.retentionMode).toBe('CUSTODY');
    expect(row.confirmedAt).toEqual(NOW);
  });

  it('no expone el numero de documento en claro dentro del hash', () => {
    const { identity, report } = certifiedFixture();
    const row = buildPatientIdentityData({ scope: SCOPE, identity, report });
    expect(row.recordHash).not.toContain(row.documentNumber);
  });
});

describe('persistence — verificacion de integridad', () => {
  it('acepta una fila intacta', () => {
    const { row, hash } = storedRow();
    expect(verifyIdentityRecordHash(row, hash)).toBe(true);
  });

  it('detecta un documento alterado en la base de datos', () => {
    const { row, hash } = storedRow();
    expect(verifyIdentityRecordHash({ ...row, documentNumber: '99999999' }, hash)).toBe(false);
  });

  it('detecta sexo, municipio o fecha alterados', () => {
    const { row, hash } = storedRow();
    expect(verifyIdentityRecordHash({ ...row, sexCode: 'F' as never }, hash)).toBe(false);
    expect(verifyIdentityRecordHash({ ...row, municipalityCode: '76001' }, hash)).toBe(false);
    expect(verifyIdentityRecordHash({ ...row, birthDate: new Date('1971-08-08T00:00:00.000Z') }, hash)).toBe(false);
  });

  it('detecta un nombre agregado a posteriori', () => {
    const { row, hash } = storedRow();
    expect(verifyIdentityRecordHash({ ...row, givenNames: [...row.givenNames, 'Falso'] }, hash)).toBe(false);
  });

  it('verifica sin fallar cuando la fila no trae telefono ni correo', () => {
    const { identity, report } = certifiedFixture();
    const row = buildPatientIdentityData({ scope: SCOPE, identity, report });
    expect(row.phoneE164).toBeNull();
    expect(row.email).toBeNull();
    expect(verifyIdentityRecordHash(row, row.recordHash)).toBe(true);
  });

  it('sobrevive el round-trip disco -> memoria de la capa de persistencia', () => {
    // Simula lo que devuelve Prisma: Date real y arrays de string.
    const { row, hash } = storedRow();
    const desdeDisco = {
      ...row,
      birthDate: new Date(row.birthDate.getTime()),
      givenNames: [...row.givenNames],
      familyNames: [...row.familyNames],
    };
    expect(verifyIdentityRecordHash(desdeDisco, hash)).toBe(true);
  });
});
