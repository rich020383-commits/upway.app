declare module 'libsodium-wrappers' {
  export const ready: Promise<void>;
  export function crypto_sign_verify_detached(
    sig: Uint8Array,
    msg: Uint8Array,
    key: Uint8Array
  ): boolean;
  export function crypto_sign_keypair(): {
    publicKey: Uint8Array;
    privateKey: Uint8Array;
  };
  export function crypto_sign_detached(msg: Uint8Array, key: Uint8Array): Uint8Array;
  const _default: {
    ready: Promise<void>;
    crypto_sign_verify_detached: (
      sig: Uint8Array,
      msg: Uint8Array,
      key: Uint8Array
    ) => boolean;
    crypto_sign_keypair: () => { publicKey: Uint8Array; privateKey: Uint8Array };
    crypto_sign_detached: (msg: Uint8Array, key: Uint8Array) => Uint8Array;
  };
  export default _default;
}
