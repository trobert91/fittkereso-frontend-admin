/**
 * Temporary-password generation, ported from the control-plane project.
 *
 * Generated in the browser rather than server-side on purpose: the superadmin
 * needs to read the password off the screen and pass it on, so it has to exist
 * in front of them before anything is submitted.
 */

export const GENERATED_PASSWORD_LENGTH = 16;

// Confusable characters are left out throughout - these get read aloud, typed
// from a screenshot, and copied out of chat windows.
const LOWER = "abcdefghijkmnopqrstuvwxyz"; // no l
const UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O
const DIGITS = "23456789"; // no 0, 1
const SYMBOLS = "!@#$%*-_=+?"; // paste- and email-safe

const CLASSES = [LOWER, UPPER, DIGITS, SYMBOLS];
const ALPHABET = CLASSES.join("");

/**
 * A uniform index below `n`.
 *
 * Rejection sampling rather than `% n`: the modulo of a uniform byte is biased
 * toward low indices whenever n does not divide 256, which would quietly skew
 * every password we generate toward the start of the alphabet.
 */
function randomIndex(n: number): number {
  const limit = 256 - (256 % n);
  const byte = new Uint8Array(1);
  do {
    crypto.getRandomValues(byte);
  } while (byte[0] >= limit);

  return byte[0] % n;
}

export function generatePassword(length = GENERATED_PASSWORD_LENGTH): string {
  if (length < CLASSES.length) {
    throw new Error(
      `A generated password needs at least ${CLASSES.length} characters`
    );
  }

  // One character from each class first, so the result always satisfies a
  // policy that demands all four.
  const chars = CLASSES.map((set) => set[randomIndex(set.length)]);

  while (chars.length < length) {
    chars.push(ALPHABET[randomIndex(ALPHABET.length)]);
  }

  // Fisher-Yates, from the same source - otherwise the first four positions
  // would always be lower, upper, digit, symbol in that order.
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const j = randomIndex(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
