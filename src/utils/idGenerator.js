// Shared utility for generating unique IDs across components
export function generateUniqueId() {
  return String(Date.now()) + Math.random().toString(36).substr(2, 9);
}

export function generateShortId() {
  return Math.random().toString(36).substr(2, 9);
}

export function generateTimestampId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
