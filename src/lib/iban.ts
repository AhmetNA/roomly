// ISO 13616 mod-97 checksum — works for any country's IBAN, not just Turkish
// ones, so this is the one check we can apply globally with no per-country
// length table. TR gets one extra check on top: its length is fixed (unlike
// most countries, where getting this wrong would need a lookup table we're
// not maintaining for the rest).
const TR_IBAN_LENGTH = 26;

export function isValidIban(rawIban: string): boolean {
  const iban = rawIban.replace(/\s+/g, '').toUpperCase();

  if (!/^[A-Z]{2}[0-9A-Z]+$/.test(iban) || iban.length < 15 || iban.length > 34) return false;
  if (iban.startsWith('TR') && iban.length !== TR_IBAN_LENGTH) return false;

  const rearranged = iban.slice(4) + iban.slice(0, 4);
  const numeric = rearranged.replace(/[A-Z]/g, (letter) => String(letter.charCodeAt(0) - 55));

  // mod-97 on a number with 30+ digits: reduce in chunks to stay within
  // Number's safe integer range instead of using BigInt.
  let remainder = 0;
  for (let i = 0; i < numeric.length; i += 7) {
    remainder = Number(`${remainder}${numeric.slice(i, i + 7)}`) % 97;
  }

  return remainder === 1;
}
