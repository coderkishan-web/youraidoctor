/**
 * Intent Engine for AI Medical Companion
 * Detects user intent before Gemini or medical reasoning is invoked.
 */

export const INTENTS = {
    GREETING: 'Greeting',
    MEDICAL_SYMPTOMS: 'Medical Symptoms',
    MEDICATION_QUESTION: 'Medication Question',
    DISEASE_EDUCATION: 'Disease Education',
    NUTRITION: 'Nutrition',
    MENTAL_WELLNESS: 'Mental Wellness',
    LIFESTYLE: 'Lifestyle',
    APPOINTMENT_BOOKING: 'Appointment Booking',
    NEARBY_HOSPITAL: 'Nearby Hospital',
    EMERGENCY: 'Emergency',
    GENERAL_CONVERSATION: 'General Conversation',
    GENERAL_KNOWLEDGE: 'General Knowledge',
    OFF_TOPIC: 'Off Topic',
    GOODBYE: 'Goodbye',
    UNKNOWN: 'Unknown'
};

/**
 * Detects intent from user message.
 */
export function detectIntent(message = '', context = {}) {
    if (!message || typeof message !== 'string') {
        return { intent: INTENTS.UNKNOWN, confidence: 0.1, isMedical: false };
    }

    const text = message.trim().toLowerCase();

    // 1. Emergency Check (highest priority)
    const emergencyRegex = /\b(chest pain|heart attack|can't breathe|cannot breathe|difficulty breathing|shortness of breath|stroke|face drooping|slurred speech|unconscious|passed out|fainted|poison|poisoning|swallowed bleach|bleeding profusely|severe bleeding|anaphylaxis|suicide|suicidal|want to die|kill myself)\b/i;
    if (emergencyRegex.test(text)) {
        return { intent: INTENTS.EMERGENCY, confidence: 0.99, isMedical: true, isEmergency: true };
    }

    // 2. Greeting
    const greetingRegex = /^(hi|hello|hey|hey there|good morning|good afternoon|good evening|namaskar|namaste|haise|hie|ssup|what's up|yo|greetings|doc|doctor|hi doc|hello doctor)\b/i;
    if (greetingRegex.test(text) && text.split(' ').length <= 5 && !/\b(pain|hurt|fever|sick|headache|ache|cough|doctor|medicine)\b/i.test(text.replace(/doctor|doc/gi, ''))) {
        return { intent: INTENTS.GREETING, confidence: 0.95, isMedical: false };
    }

    // 3. Goodbye
    const goodbyeRegex = /^(bye|goodbye|see you|take care|thanks bye|thank you bye|tata|cya)\b/i;
    if (goodbyeRegex.test(text)) {
        return { intent: INTENTS.GOODBYE, confidence: 0.95, isMedical: false };
    }

    // 4. Appointment Booking
    const appointmentRegex = /\b(book|schedule|appointment|doctor booking|see a doctor|consultation|find a doctor|doctor list|specialist|dermatologist|cardiologist|neurologist|pediatrician|gynecologist)\b/i;
    if (appointmentRegex.test(text)) {
        return { intent: INTENTS.APPOINTMENT_BOOKING, confidence: 0.90, isMedical: true };
    }

    // 5. Nearby Hospital
    const hospitalRegex = /\b(hospital|clinic|emergency room|er near me|nearby hospital|trauma center|ambulance|pharmacy near me)\b/i;
    if (hospitalRegex.test(text)) {
        return { intent: INTENTS.NEARBY_HOSPITAL, confidence: 0.90, isMedical: true };
    }

    // 6. Medication Question
    const medicationRegex = /\b(medication|medicine|pill|dosage|side effect|paracetamol|ibuprofen|aspirin|antibiotic|syrup|tablet|capsule|dose|drug interaction)\b/i;
    if (medicationRegex.test(text) && !/\b(headache|fever|pain|cough)\b/i.test(text)) {
        return { intent: INTENTS.MEDICATION_QUESTION, confidence: 0.88, isMedical: true };
    }

    // 7. Mental Wellness
    const mentalRegex = /\b(anxiety|depressed|depression|panic attack|stressed|stress|lonely|sad|overwhelmed|insomnia|can't sleep|mental health|fear)\b/i;
    if (mentalRegex.test(text)) {
        return { intent: INTENTS.MENTAL_WELLNESS, confidence: 0.88, isMedical: true };
    }

    // 8. Nutrition
    const nutritionRegex = /\b(diet|nutrition|calories|protein|weight loss|gain weight|food for|vitamins|supplements|keto|hydration|water intake)\b/i;
    if (nutritionRegex.test(text)) {
        return { intent: INTENTS.NUTRITION, confidence: 0.85, isMedical: true };
    }

    // 9. Lifestyle
    const lifestyleRegex = /\b(sleep|exercise|workout|running|yoga|habit|smoking|alcohol|work stress|sedentary|posture)\b/i;
    if (lifestyleRegex.test(text)) {
        return { intent: INTENTS.LIFESTYLE, confidence: 0.85, isMedical: true };
    }

    // 10. Disease Education
    const diseaseEduRegex = /\b(what is|cause of|symptoms of|tell me about|explain|cure for)\b/i;
    if (diseaseEduRegex.test(text) && /\b(diabetes|cancer|hypertension|bp|cholesterol|asthma|malaria|dengue|covid|flu|migraine|arthritis|thyroid)\b/i.test(text)) {
        return { intent: INTENTS.DISEASE_EDUCATION, confidence: 0.88, isMedical: true };
    }

    // 11. Medical Symptoms
    const symptomsRegex = /\b(pain|hurt|headache|fever|cough|cold|stomach|cramps|nausea|vomiting|diarrhea|rash|itch|swelling|dizzy|dizziness|fatigue|tired|sore throat|chills|backache|chest|arm|leg|joint|throat|stiff|cramping|dukhtay|dok|doka|sar dard|pet dard|bukhar|tap|taap|dard|dukhte)\b/i;
    if (symptomsRegex.test(text)) {
        return { intent: INTENTS.MEDICAL_SYMPTOMS, confidence: 0.92, isMedical: true };
    }

    // 12. Off Topic / General Knowledge (e.g. "BMW M5 price", "What is React?")
    const offTopicRegex = /\b(bmw|audi|car|price|react|javascript|python|coding|cricket|football|movie|actor|president|capital of|weather|stock|crypto|bitcoin|news|game)\b/i;
    if (offTopicRegex.test(text)) {
        return { intent: INTENTS.OFF_TOPIC, confidence: 0.95, isMedical: false };
    }

    // 13. General Conversation
    const casualRegex = /\b(how are you|who are you|what is your name|tell me a joke|are you human|are you AI|nice|cool|awesome|great|okay|ok|got it|thanks|thank you)\b/i;
    if (casualRegex.test(text)) {
        return { intent: INTENTS.GENERAL_CONVERSATION, confidence: 0.85, isMedical: false };
    }

    return { intent: INTENTS.UNKNOWN, confidence: 0.50, isMedical: false };
}
