// backend/services/ai/ReplySanitizer.js
/**
 * Simple reply sanitizer to reduce AI‑like boilerplate and duplicate sentences.
 * It removes known generic phrases and deduplicates identical sentences.
 */
export function sanitizeReply(reply) {
  if (!reply) return reply;
  // List of generic AI boilerplate phrases to strip out
  const boilerplate = [
    "I am paying close attention to your symptoms",
    "Based on what you've described",
    "I think",
    "I see",
    "I understand",
    "Based on the information you provided",
    "I am here to help",
    "Feel free to ask",
    "Let me know if you need anything else",
    "If you'd like, we can continue discussing your health whenever you're ready",
    "If you have any other questions"
  ];
  // Remove boilerplate phrases (case‑insensitive)
  let cleaned = reply;
  boilerplate.forEach(p => {
    const regex = new RegExp(p, 'gi');
    cleaned = cleaned.replace(regex, '').replace(/\s{2,}/g, ' ');
  });
  // Split into sentences and dedupe
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  const unique = [];
  const seen = new Set();
  sentences.forEach(s => {
    const key = s.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(s);
    }
  });
  // Re‑join with proper spacing
  return unique.join(' ');
}
