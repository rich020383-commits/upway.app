import { createHash } from 'crypto';

export function hashPassword(password: string) {
  const salt = Math.random().toString(36).slice(2, 12);
  const hash = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return `sha256$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  const [algorithm, salt, hash] = storedPassword.split('$');
  if (algorithm !== 'sha256' || !salt || !hash) {
    return false;
  }

  const candidate = createHash('sha256').update(`${salt}:${password}`).digest('hex');
  return candidate === hash;
}
