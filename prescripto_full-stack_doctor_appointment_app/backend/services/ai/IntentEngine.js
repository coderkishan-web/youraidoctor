/**
 * Intent Engine for AI Medical Companion (Phase 5 Enhanced)
 * Uses confidence-based classification, reasoning, and thresholding.
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
    MAP_NAVIGATION: 'Map Navigation',
    EMERGENCY: 'Emergency',
    GENERAL_CONVERSATION: 'General Conversation',
    GENERAL_KNOWLEDGE: 'General Knowledge',
    OFF_TOPIC: 'Off Topic',
    FEEDBACK: 'Feedback',
    SETTINGS: 'Settings',
    GOODBYE: 'Goodbye',
    UNKNOWN: 'Unknown'
};

export const CONFIDENCE_THRESHOLD = 0.70; // 70% threshold

/**
 * Detects intent from user message with confidence score & medical confidence score.
 */
export function detectIntent(message = '', context = {}) {
    if (!message || typeof message !== 'string') {
        return {
            intent: INTENTS.UNKNOWN,
            confidence: 0.1,
            medicalConfidence: 0.05,
            reason: 'Empty or invalid input',
            isMedical: false,
            intentCategory: 'UNKNOWN'
        };
    }

    const text = message.trim().toLowerCase();

    // 1. Emergency Check (Highest priority, medical confidence 0.99)
    const emergencyRegex = /\b(chest pain|heart attack|can't breathe|cannot breathe|difficulty breathing|shortness of breath|stroke|face drooping|slurred speech|unconscious|passed out|fainted|poison|poisoning|swallowed bleach|bleeding profusely|severe bleeding|anaphylaxis|suicide|suicidal|want to die|kill myself)\b/i;
    if (emergencyRegex.test(text)) {
        return {
            intent: INTENTS.EMERGENCY,
            confidence: 0.99,
            medicalConfidence: 0.99,
            reason: 'Emergency symptoms or acute life threat detected',
            isMedical: true,
            isEmergency: true,
            intentCategory: 'CLINICAL'
        };
    }

    // 2. Greeting
    const greetingRegex = /^(hi|hello|hey|hey there|good morning|good afternoon|good evening|namaskar|namaste|haise|hie|ssup|what's up|yo|greetings|doc|doctor|hi doc|hello doctor)\b/i;
    if (greetingRegex.test(text) && text.split(' ').length <= 6 && !/\b(pain|hurt|fever|sick|headache|ache|cough|medicine)\b/i.test(text.replace(/doctor|doc/gi, ''))) {
        return {
            intent: INTENTS.GREETING,
            confidence: 0.95,
            medicalConfidence: 0.05,
            reason: 'Standard greeting phrase without symptom payload',
            isMedical: false,
            intentCategory: 'CONVERSATIONAL'
        };
    }

    // 3. Goodbye
    const goodbyeRegex = /^(bye|goodbye|see you|take care|thanks bye|thank you bye|tata|cya)\b/i;
    if (goodbyeRegex.test(text)) {
        return {
            intent: INTENTS.GOODBYE,
            confidence: 0.95,
            medicalConfidence: 0.02,
            reason: 'Farewell phrase',
            isMedical: false,
            intentCategory: 'CONVERSATIONAL'
        };
    }

    // 4. Appointment Booking
    const appointmentRegex = /\b(book|schedule|appointment|doctor booking|see a doctor|consultation|find a doctor|doctor list|specialist|dermatologist|cardiologist|neurologist|pediatrician|gynecologist)\b/i;
    if (appointmentRegex.test(text)) {
        return {
            intent: INTENTS.APPOINTMENT_BOOKING,
            confidence: 0.92,
            medicalConfidence: 0.65,
            reason: 'User requesting doctor booking or appointment scheduling',
            isMedical: true,
            intentCategory: 'OPERATIONAL'
        };
    }

    // 5. AI Map Controller & Navigation Commands
    const mapNavRegex = /\b(take me to|navigate|navigation|find|find a|show|show me|search|search for|blood bank|pharmacy|chemist|ambulance|clinic|diagnostic|police|fire station|pediatric|orthopedic|cardiac|maternity|within \d+|cancel navigation|stop navigation|call hospital)\b/i;
    if (mapNavRegex.test(text) && /\b(hospitals?|pharmac(y|ies)|blood banks?|ambulances?|clinics?|diagnostics?|navigate|navigation|er|trauma|police|fire)\b/i.test(text)) {
        let mapAction = 'SEARCH_FACILITY';
        let mapCategory = 'hospitals';
        let mapSpecialty = null;
        let maxRadiusKm = null;

        if (/\b(take me to|navigate to|start navigation|navigate there)\b/i.test(text)) mapAction = 'START_NAVIGATION';
        if (/\b(cancel navigation|stop navigation|exit navigation)\b/i.test(text)) mapAction = 'CANCEL_NAVIGATION';
        if (/\b(call|phone|contact)\b/i.test(text)) mapAction = 'CALL_FACILITY';
        if (/\b(another|next hospital|different hospital)\b/i.test(text)) mapAction = 'SHOW_ANOTHER';

        if (/\b(pharmacy|chemist|medical shop|medicine)\b/i.test(text)) mapCategory = 'pharmacies';
        else if (/\b(blood bank|blood)\b/i.test(text)) mapCategory = 'blood_banks';
        else if (/\b(ambulance)\b/i.test(text)) mapCategory = 'ambulances';
        else if (/\b(clinic)\b/i.test(text)) mapCategory = 'clinics';
        else if (/\b(diagnostic|lab|mri|ct scan|scan)\b/i.test(text)) mapCategory = 'diagnostics';
        else if (/\b(police)\b/i.test(text)) mapCategory = 'police';
        else if (/\b(fire station|fire)\b/i.test(text)) mapCategory = 'fire_stations';

        if (/\b(pediatric|children|kids)\b/i.test(text)) mapSpecialty = 'Pediatrics';
        if (/\b(orthopedic|ortho|bone|fracture)\b/i.test(text)) mapSpecialty = 'Orthopedics';
        if (/\b(cardiac|heart|chest)\b/i.test(text)) mapSpecialty = 'Cardiology';
        if (/\b(maternity|pregnancy|gynec)\b/i.test(text)) mapSpecialty = 'Maternity';

        const radiusMatch = text.match(/within (\d+)\s*km/i);
        if (radiusMatch) maxRadiusKm = parseInt(radiusMatch[1]);

        return {
            intent: INTENTS.MAP_NAVIGATION,
            confidence: 0.95,
            medicalConfidence: 0.80,
            reason: 'User requesting interactive map action or navigation',
            isMedical: true,
            intentCategory: 'MAP_NAVIGATION',
            mapAction,
            mapCategory,
            mapSpecialty,
            maxRadiusKm
        };
    }

    // 5b. Nearby Hospital (Legacy Fallback)
    const hospitalRegex = /\b(hospital|clinic|emergency room|er near me|nearby hospital|trauma center|ambulance|pharmacy near me)\b/i;
    if (hospitalRegex.test(text)) {
        return {
            intent: INTENTS.NEARBY_HOSPITAL,
            confidence: 0.92,
            medicalConfidence: 0.70,
            reason: 'User searching for hospital or emergency facility',
            isMedical: true,
            intentCategory: 'OPERATIONAL',
            mapAction: 'SEARCH_FACILITY',
            mapCategory: 'hospitals'
        };
    }

    // 6. Medication Question
    const medicationRegex = /\b(medication|medicine|pill|dosage|side effect|paracetamol|ibuprofen|aspirin|antibiotic|syrup|tablet|capsule|dose|drug interaction)\b/i;
    if (medicationRegex.test(text) && !/\b(headache|fever|pain|cough|hurt|sick)\b/i.test(text)) {
        return {
            intent: INTENTS.MEDICATION_QUESTION,
            confidence: 0.90,
            medicalConfidence: 0.85,
            reason: 'Pharmacological or drug interaction query',
            isMedical: true,
            intentCategory: 'CLINICAL'
        };
    }

    // 7. Mental Wellness
    const mentalRegex = /\b(anxiety|depressed|depression|panic attack|stressed|stress|lonely|sad|overwhelmed|insomnia|can't sleep|mental health|fear)\b/i;
    if (mentalRegex.test(text)) {
        return {
            intent: INTENTS.MENTAL_WELLNESS,
            confidence: 0.89,
            medicalConfidence: 0.75,
            reason: 'Emotional or psychological well-being query',
            isMedical: true,
            intentCategory: 'WELLNESS'
        };
    }

    // 8. Nutrition
    const nutritionRegex = /\b(diet|nutrition|calories|protein|weight loss|gain weight|food for|vitamins|supplements|keto|hydration|water intake)\b/i;
    if (nutritionRegex.test(text)) {
        return {
            intent: INTENTS.NUTRITION,
            confidence: 0.88,
            medicalConfidence: 0.50,
            reason: 'Dietary or nutritional inquiry',
            isMedical: true,
            intentCategory: 'WELLNESS'
        };
    }

    // 9. Lifestyle
    const lifestyleRegex = /\b(sleep|exercise|workout|running|yoga|habit|smoking|alcohol|work stress|sedentary|posture)\b/i;
    if (lifestyleRegex.test(text)) {
        return {
            intent: INTENTS.LIFESTYLE,
            confidence: 0.87,
            medicalConfidence: 0.45,
            reason: 'Physical activity or general habit inquiry',
            isMedical: true,
            intentCategory: 'WELLNESS'
        };
    }

    // 10. Disease Education
    const diseaseEduRegex = /\b(what is|cause of|symptoms of|tell me about|explain|cure for)\b/i;
    if (diseaseEduRegex.test(text) && /\b(diabetes|cancer|hypertension|bp|cholesterol|asthma|malaria|dengue|covid|flu|migraine|arthritis|thyroid)\b/i.test(text)) {
        return {
            intent: INTENTS.DISEASE_EDUCATION,
            confidence: 0.90,
            medicalConfidence: 0.80,
            reason: 'Educational inquiry about a specific disease/condition',
            isMedical: true,
            intentCategory: 'CLINICAL'
        };
    }

    // 11. Medical Symptoms
    const symptomsRegex = /\b(pain|hurt|headache|fever|cough|cold|stomach|cramps|nausea|vomiting|diarrhea|rash|itch|swelling|dizzy|dizziness|fatigue|tired|sore throat|chills|backache|chest|arm|leg|joint|throat|stiff|cramping|dukhtay|dok|doka|sar dard|pet dard|bukhar|tap|taap|dard|dukhte)\b/i;
    if (symptomsRegex.test(text)) {
        return {
            intent: INTENTS.MEDICAL_SYMPTOMS,
            confidence: 0.94,
            medicalConfidence: 0.96,
            reason: 'User reporting physical medical symptoms',
            isMedical: true,
            intentCategory: 'CLINICAL'
        };
    }

    // 12. General Knowledge / Off Topic (e.g. "BMW M5 price", "What is React?")
    const generalKnowledgeRegex = /\b(bmw|audi|mercedes|car|tesla|price|cost of|react|javascript|python|coding|programming|cricket|football|basketball|movie|actor|actress|president|prime minister|capital of|weather|stock|crypto|bitcoin|news|game|galaxy|quantum|physics|math|history|war|geography)\b/i;
    if (generalKnowledgeRegex.test(text)) {
        return {
            intent: INTENTS.GENERAL_KNOWLEDGE,
            confidence: 0.96,
            medicalConfidence: 0.01,
            reason: 'Factual, automotive, technological, or general knowledge query',
            isMedical: false,
            intentCategory: 'GENERAL_KNOWLEDGE'
        };
    }

    // 13. General Conversation & Social Chit-chat
    const casualRegex = /\b(how are you|who are you|what is your name|tell me a joke|are you human|are you ai|nice|cool|awesome|great|okay|ok|got it|thanks|thank you|sounds good)\b/i;
    if (casualRegex.test(text)) {
        return {
            intent: INTENTS.GENERAL_CONVERSATION,
            confidence: 0.88,
            medicalConfidence: 0.02,
            reason: 'Casual conversation, social greeting, or acknowledgement',
            isMedical: false,
            intentCategory: 'CONVERSATIONAL'
        };
    }

    // 14. Feedback
    if (/\b(feedback|bug|issue|problem with app|suggestion|feature request|rate)\b/i.test(text)) {
        return {
            intent: INTENTS.FEEDBACK,
            confidence: 0.85,
            medicalConfidence: 0.0,
            reason: 'App feedback or feature suggestion',
            isMedical: false,
            intentCategory: 'OPERATIONAL'
        };
    }

    // 15. Settings
    if (/\b(settings|profile|change language|theme|dark mode|account|password)\b/i.test(text)) {
        return {
            intent: INTENTS.SETTINGS,
            confidence: 0.85,
            medicalConfidence: 0.0,
            reason: 'User account or application settings request',
            isMedical: false,
            intentCategory: 'OPERATIONAL'
        };
    }

    // Default Unknown
    return {
        intent: INTENTS.UNKNOWN,
        confidence: 0.50,
        medicalConfidence: 0.10,
        reason: 'Low confidence matching across intent patterns',
        isMedical: false,
        intentCategory: 'UNKNOWN'
    };
}
