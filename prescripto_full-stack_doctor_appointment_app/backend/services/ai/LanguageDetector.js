/**
 * Language Detector for AI Medical Companion
 * Detects language and script from user input.
 */

export function detectLanguage(message = '') {
    if (!message || typeof message !== 'string') {
        return { language: 'English', isDevanagari: false, confidence: 1.0 };
    }

    const text = message.trim();

    // Check Devanagari script (Hindi / Marathi)
    const devanagariRegex = /[\u0900-\u097F]/;
    if (devanagariRegex.test(text)) {
        if (/\b(aahe|kasa|kay|mala|tukde|dok|doka|kamal|bardach)\b/i.test(text)) {
            return { language: 'Marathi', isDevanagari: true, confidence: 0.92 };
        }
        return { language: 'Hindi', isDevanagari: true, confidence: 0.95 };
    }

    // Check Hinglish patterns
    const hinglishRegex = /\b(namaskar|namaste|haise|hie|kya|hai|ho|raha|rahi|dard|sir|sar|pet|bukhar|taap|tap|dukhtay|madad|karo|batao|kaisa|kaise|chahiye)\b/i;
    if (hinglishRegex.test(text)) {
        return { language: 'Hinglish', isDevanagari: false, confidence: 0.90 };
    }

    // Check Spanish basic patterns
    if (/\b(hola|gracias|dolor|cabeza|fiebre|como|esta|por favor|ayuda)\b/i.test(text)) {
        return { language: 'Spanish', isDevanagari: false, confidence: 0.88 };
    }

    // Default to English
    return { language: 'English', isDevanagari: false, confidence: 0.98 };
}
