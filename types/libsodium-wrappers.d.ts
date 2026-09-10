declare module 'libsodium-wrappers' {
  export const ready: Promise<void>;
  export function crypto_sign_verify_detached(
    sig: Uint8Array,
    msg: Uint8Array,
    key: Uint8Array
  ): boolean;
  const _default: {
    ready: Promise<void>;
    crypto_sign_verify_detached: (
      sig: Uint8Array,
      msg: Uint8Array,
      key: Uint8Array
    ) => boolean;
  };
  export default _default;
}
