import { randomFillSync } from "crypto";

const generateRandomAlphanumeric = (length: number) => {
  return [...randomFillSync(Buffer.alloc(length), 0, length).toString('base64')].filter(c => /[a-zA-Z0-9]/.test(c)).join('').slice(0, length);
};

export default generateRandomAlphanumeric;
