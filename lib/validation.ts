/** Helpers de validación compartidos por los wizards de onboarding. */

/** Devuelve un mensaje por cada id requerido faltante o vacío. */
export function validateRequired(
  ids: string[],
  answers: Record<string, string>,
  labels?: Record<string, string>
): string[] {
  return ids
    .filter((id) => !(answers[id] ?? '').trim())
    .map((id) => {
      const label = labels?.[id] ?? id;
      return `Completa el campo "${label}".`;
    });
}

/** Devuelve un mensaje si el valor no es un correo válido; vacío si es válido o está en blanco. */
export function validateEmail(value: string): string[] {
  const v = value.trim();
  if (!v) return [];
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? [] : ['Ingresa un correo electrónico válido.'];
}
