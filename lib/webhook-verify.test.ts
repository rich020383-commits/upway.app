import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { verifyMetaSignature, verifyVapiSignature, verifySharedSecret } from './webhook-verify';

const SECRET = 'test-secret';
const BODY = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });

const signMeta = (body: string, secret: string) =>
  'sha256=' + crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');

const signVapi = (body: string, secret: string) =>
  crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');

describe('verifyMetaSignature', () => {
  it('accepts a valid sha256= signature', () => {
    expect(verifyMetaSignature(BODY, signMeta(BODY, SECRET), SECRET)).toBe(true);
  });

  it('rejects a signature signed with the wrong secret', () => {
    expect(verifyMetaSignature(BODY, signMeta(BODY, 'other-secret'), SECRET)).toBe(false);
  });

  it('rejects a tampered body', () => {
    const sig = signMeta(BODY, SECRET);
    expect(verifyMetaSignature(BODY + ' ', sig, SECRET)).toBe(false);
  });

  it('rejects a missing header', () => {
    expect(verifyMetaSignature(BODY, null, SECRET)).toBe(false);
  });

  it('rejects a header without the sha256= prefix', () => {
    const raw = signMeta(BODY, SECRET).slice('sha256='.length);
    expect(verifyMetaSignature(BODY, raw, SECRET)).toBe(false);
  });

  it('rejects a wrong-length hex digest without throwing', () => {
    expect(verifyMetaSignature(BODY, 'sha256=abcd', SECRET)).toBe(false);
  });

  it('rejects an empty secret (no valid comparison possible)', () => {
    const sig = signMeta(BODY, '');
    expect(verifyMetaSignature(BODY, sig, '')).toBe(false);
  });
});

describe('verifyVapiSignature', () => {
  it('accepts a valid hex signature', () => {
    expect(verifyVapiSignature(BODY, signVapi(BODY, SECRET), SECRET)).toBe(true);
  });

  it('rejects an invalid signature', () => {
    expect(verifyVapiSignature(BODY, signVapi(BODY, 'other'), SECRET)).toBe(false);
  });

  it('rejects a missing header', () => {
    expect(verifyVapiSignature(BODY, null, SECRET)).toBe(false);
  });

  it('rejects a wrong-length hex digest without throwing', () => {
    expect(verifyVapiSignature(BODY, 'deadbeef', SECRET)).toBe(false);
  });
});

describe('verifySharedSecret', () => {
  it('accepts the correct secret', () => {
    expect(verifySharedSecret(SECRET, SECRET)).toBe(true);
  });

  it('rejects a wrong secret', () => {
    expect(verifySharedSecret('wrong', SECRET)).toBe(false);
  });

  it('rejects a missing secret', () => {
    expect(verifySharedSecret(null, SECRET)).toBe(false);
  });

  it('rejects wrong-length secrets without throwing', () => {
    expect(verifySharedSecret('short', SECRET)).toBe(false);
  });
});
