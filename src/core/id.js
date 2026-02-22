const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
const ID_LENGTH = 8;

export function nanoid() {
  let id = '';
  const bytes = crypto.getRandomValues(new Uint8Array(ID_LENGTH));
  for (let i = 0; i < ID_LENGTH; i++) {
    id += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return id;
}
