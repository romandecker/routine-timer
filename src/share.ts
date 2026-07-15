import { isRoutine } from "./storage";
import type { Routine } from "./types";

/**
 * Encode/decode a routine as a self-contained, shareable string that lives in
 * the URL hash fragment — never sent to the server, TS-playground style.
 *
 * Wire format:  `<version>~<base64url(deflate-raw(utf8(json)))>`
 *
 * The version is a PLAINTEXT PREFIX, deliberately OUTSIDE the compressed blob,
 * so a future reader can decide how to decompress before touching the payload.
 * (A version buried inside the JSON could never survive a change to the
 * compression itself.) base64url keeps the payload intact through messaging
 * apps that mangle `+ / =`.
 */
const VERSION = "1";
const SEP = "~";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function pipe(bytes: Uint8Array, transform: GenericTransformStream): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(transform);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

const deflate = (b: Uint8Array) => pipe(b, new CompressionStream("deflate-raw"));
const inflate = (b: Uint8Array) => pipe(b, new DecompressionStream("deflate-raw"));

/** Encode a routine into the shareable payload (goes after the `#`). */
export async function encodeRoutine(routine: Routine): Promise<string> {
  const json = JSON.stringify(routine);
  const compressed = await deflate(new TextEncoder().encode(json));
  return VERSION + SEP + toBase64Url(compressed);
}

/**
 * Decode a payload back into a routine, or `null` if it is malformed, an
 * unknown version, or fails validation. Never throws, never returns a
 * half-parsed routine.
 */
export async function decodeRoutine(payload: string): Promise<Routine | null> {
  try {
    const sep = payload.indexOf(SEP);
    if (sep === -1) return null;
    const version = payload.slice(0, sep);
    if (version !== VERSION) return null;
    const compressed = fromBase64Url(payload.slice(sep + 1));
    const json = new TextDecoder().decode(await inflate(compressed));
    const parsed: unknown = JSON.parse(json);
    return isRoutine(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/** Build a full shareable URL for the current origin. */
export async function buildShareUrl(routine: Routine): Promise<string> {
  const payload = await encodeRoutine(routine);
  const { origin, pathname } = window.location;
  return `${origin}${pathname}#${payload}`;
}
