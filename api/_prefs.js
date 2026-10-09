/* The settings schema — one file, read by both sides.
 *
 * The browser imports it to render the settings page and to clean up
 * whatever is in localStorage; the API imports it to validate what it
 * is sent and to pack settings into sync codes. Adding a setting here
 * adds it everywhere, and the two sides can never disagree about what
 * a valid value is.
 *
 * Every setting but one is a choice from a short list, which is what
 * lets a whole setup pack into a few bytes: each choice is stored as
 * its index, in as few bits as its list needs.
 */

export const ACCENTS = ['section', 'yellow', 'pink', 'blue', 'violet', 'lime', 'teal'];

export const SCHEMA = {
  theme:   { values: ['light', 'dark', 'system'], def: 'light' },
  text:    { values: ['regular', 'large'], def: 'regular' },
  motion:  { values: ['full', 'calm', 'still'], def: 'full' },
  smooth:  { values: ['on', 'off'], def: 'on' },
  loader:  { values: ['always', 'once', 'never'], def: 'always' },
  cursor:  { values: ['drawn', 'system'], def: 'drawn' },
  tagAcc:  { values: ACCENTS, def: 'section' },
  answer:  { values: ['brief', 'detailed'], def: 'brief' },
  sources: { values: ['show', 'hide'], def: 'show' },
};

export const KEYS = Object.keys(SCHEMA);

// The one free-text setting: the name on your cursor.
export const TAG_MAX = 12;
export const TAG_DEF = 'You';
const TAG_OK = /^[\p{L}\p{N} .'-]+$/u;

export const DEFAULTS = Object.freeze({
  ...Object.fromEntries(KEYS.map((k) => [k, SCHEMA[k].def])),
  tag: TAG_DEF,
});

const cleanTag = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();

/* Strict: says exactly what is wrong with each field. Used by the API,
   where a bad request should be refused, not quietly repaired. */
export function validate(input) {
  const errors = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, errors: { _: 'Expected an object of settings.' } };
  }
  for (const k of Object.keys(input)) {
    if (k !== 'tag' && !SCHEMA[k]) errors[k] = 'Not a setting.';
  }
  for (const k of KEYS) {
    if (k in input && !SCHEMA[k].values.includes(input[k])) {
      errors[k] = `Must be one of: ${SCHEMA[k].values.join(', ')}.`;
    }
  }
  if ('tag' in input) {
    const t = cleanTag(input.tag);
    if (!t) errors.tag = 'Cannot be empty.';
    else if ([...t].length > TAG_MAX) errors.tag = `At most ${TAG_MAX} characters.`;
    else if (!TAG_OK.test(t)) errors.tag = 'Letters, numbers, spaces and . \' - only.';
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: normalize(input) };
}

/* Lenient: keeps what is valid, falls back to the default for the rest.
   Used on whatever the browser had stored, which may be from an older
   version of this schema. */
export function normalize(input = {}) {
  const out = { ...DEFAULTS };
  for (const k of KEYS) if (SCHEMA[k].values.includes(input?.[k])) out[k] = input[k];
  const t = cleanTag(input?.tag);
  if (t && [...t].length <= TAG_MAX && TAG_OK.test(t)) out.tag = t;
  return out;
}

/* ------------------------------------------------------------------ *
 * Packing. Choices go into a bit field, the tag follows as UTF-8.
 * ------------------------------------------------------------------ */

export const VERSION = 1;
const bitsFor = (n) => Math.max(1, Math.ceil(Math.log2(n)));

export function pack(prefs) {
  const p = normalize(prefs);
  let field = 0n;
  let shift = 0n;
  for (const k of KEYS) {
    field |= BigInt(SCHEMA[k].values.indexOf(p[k])) << shift;
    shift += BigInt(bitsFor(SCHEMA[k].values.length));
  }
  const width = Math.ceil(Number(shift) / 8);
  const head = [VERSION];
  for (let i = 0; i < width; i += 1) head.push(Number((field >> BigInt(i * 8)) & 0xffn));
  // The default tag costs nothing.
  const tag = p.tag === TAG_DEF ? [] : [...new TextEncoder().encode(p.tag)];
  return Uint8Array.from([...head, ...tag]);
}

export function unpack(bytes) {
  if (!bytes.length || bytes[0] !== VERSION) throw new Error('Unknown code version.');
  const total = KEYS.reduce((s, k) => s + bitsFor(SCHEMA[k].values.length), 0);
  const width = Math.ceil(total / 8);
  if (bytes.length < 1 + width) throw new Error('Code is too short.');
  let field = 0n;
  for (let i = 0; i < width; i += 1) field |= BigInt(bytes[1 + i]) << BigInt(i * 8);
  const out = {};
  let shift = 0n;
  for (const k of KEYS) {
    const b = BigInt(bitsFor(SCHEMA[k].values.length));
    const idx = Number((field >> shift) & ((1n << b) - 1n));
    shift += b;
    if (idx >= SCHEMA[k].values.length) throw new Error(`Bad value for ${k}.`);
    out[k] = SCHEMA[k].values[idx];
  }
  const rest = bytes.slice(1 + width);
  out.tag = rest.length ? new TextDecoder('utf-8', { fatal: true }).decode(rest) : TAG_DEF;
  return out;
}

/* Crockford base32: no I, L, O or U, so a code read aloud or typed off
   a phone survives; lookalikes are folded back on the way in. */
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function toBase32(bytes) {
  let bits = 0; let value = 0; let out = '';
  for (const byte of bytes) {
    value = ((value << 8) | byte) & 0xffff; bits += 8;
    while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

export function fromBase32(str) {
  const clean = String(str).toUpperCase().replace(/[\s-]/g, '')
    .replace(/O/g, '0').replace(/[IL]/g, '1');
  let bits = 0; let value = 0; const out = [];
  for (const ch of clean) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error(`"${ch}" is not part of a code.`);
    value = ((value << 5) | i) & 0xffff; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 0xff); bits -= 8; }
  }
  return Uint8Array.from(out);
}

export const group = (s) => s.match(/.{1,4}/g)?.join('-') ?? '';
