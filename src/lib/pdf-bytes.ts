/**
 * Node's Buffer extends Uint8Array in the Node realm. In Jest (and some
 * bundlers) the test runtime provides a *different* realm, so
 * `buffer instanceof Uint8Array` is `false` and pdf-lib — which validates
 * inputs with `instanceof` — rejects the bytes. Always hand pdf-lib a fresh
 * Uint8Array from the current realm.
 */
export function toPdfBytes(input: Uint8Array): Uint8Array {
  return Uint8Array.from(input);
}