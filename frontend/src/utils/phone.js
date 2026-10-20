export const PHONE_ERROR = "Phone number must be exactly 10 digits.";

export function phoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function isValidPhone(value) {
  const digits = phoneDigits(value);
  return digits.length === 0 || digits.length === 10;
}
