/**
 * Input validation utilities
 */
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

export function sanitizeInput(text) {
  if (!text) return '';
  return text.trim();
}
