/**
 * Decision Router for AI Medical Companion (Phase 5)
 * Central traffic controller that routes incoming messages to specific pipeline targets.
 */

export const PIPELINES = {
    EMERGENCY: 'EMERGENCY_PIPELINE',
    MEDICAL: 'MEDICAL_PIPELINE',
    GENERAL_KNOWLEDGE: 'GENERAL_KNOWLEDGE_PIPELINE',
    GENERAL_CONVERSATION: 'GENERAL_CONVERSATION_PIPELINE',
    GREETING: 'GREETING_PIPELINE',
    APPOINTMENT: 'APPOINTMENT_PIPELINE',
    MEDICATION: 'MEDICATION_PIPELINE',
    MENTAL_HEALTH: 'MENTAL_HEALTH_PIPELINE',
    NUTRITION_LIFESTYLE: 'NUTRITION_LIFESTYLE_PIPELINE',
    DISEASE_EDUCATION: 'DISEASE_EDUCATION_PIPELINE',
    OFF_TOPIC: 'OFF_TOPIC_PIPELINE',
    GOODBYE: 'GOODBYE_PIPELINE',
    UNKNOWN: 'UNKNOWN_PIPELINE'
};

/**
 * Determines the target execution pipeline for an incoming message.
 */
export function routeMessage({ intentResult = {}, memory = {}, isRecovery = false }) {
    const { intent, confidence, medicalConfidence, isEmergency } = intentResult;

    // 1. Priority 1: Emergency Intercept
    if (isEmergency || intent === 'Emergency') {
        return {
            pipeline: PIPELINES.EMERGENCY,
            reason: 'Emergency intent detected with highest priority.',
            shouldUpdateMedicalMemory: true
        };
    }

    // 2. Priority 2: Topic Recovery ("Continue", "back to my health")
    if (isRecovery && memory.currentSymptoms && memory.currentSymptoms.length > 0) {
        return {
            pipeline: PIPELINES.MEDICAL,
            reason: 'Explicit topic recovery requested by user.',
            isContextRecovery: true,
            shouldUpdateMedicalMemory: true
        };
    }

    // 3. Priority 3: General Knowledge (e.g. "What is React?", "BMW M5 price")
    if (intent === 'General Knowledge' || (intent === 'Off Topic' && confidence >= 0.70)) {
        return {
            pipeline: PIPELINES.GENERAL_KNOWLEDGE,
            reason: 'General knowledge / technical inquiry detected with high confidence.',
            shouldUpdateMedicalMemory: false,
            hasPendingMedicalTopic: Boolean(memory.currentSymptoms && memory.currentSymptoms.length > 0)
        };
    }

    // 4. Greeting
    if (intent === 'Greeting') {
        return {
            pipeline: PIPELINES.GREETING,
            reason: 'User greeting.',
            shouldUpdateMedicalMemory: false
        };
    }

    // 5. Goodbye
    if (intent === 'Goodbye') {
        return {
            pipeline: PIPELINES.GOODBYE,
            reason: 'User goodbye.',
            shouldUpdateMedicalMemory: false
        };
    }

    // 6. Appointment & Hospital Search
    if (intent === 'Appointment Booking' || intent === 'Nearby Hospital') {
        return {
            pipeline: PIPELINES.APPOINTMENT,
            reason: 'Doctor or hospital lookup requested.',
            shouldUpdateMedicalMemory: false
        };
    }

    // 7. Medication Question
    if (intent === 'Medication Question') {
        return {
            pipeline: PIPELINES.MEDICATION,
            reason: 'Medication inquiry.',
            shouldUpdateMedicalMemory: false
        };
    }

    // 8. Mental Wellness
    if (intent === 'Mental Wellness') {
        return {
            pipeline: PIPELINES.MENTAL_HEALTH,
            reason: 'Mental wellness inquiry.',
            shouldUpdateMedicalMemory: false
        };
    }

    // 9. Nutrition & Lifestyle
    if (intent === 'Nutrition' || intent === 'Lifestyle') {
        return {
            pipeline: PIPELINES.NUTRITION_LIFESTYLE,
            reason: 'Diet or habit inquiry.',
            shouldUpdateMedicalMemory: false
        };
    }

    // 10. Disease Education
    if (intent === 'Disease Education') {
        return {
            pipeline: PIPELINES.DISEASE_EDUCATION,
            reason: 'Disease education query.',
            shouldUpdateMedicalMemory: false
        };
    }

    // 11. Medical Symptoms (Full Triage Pipeline)
    if (intent === 'Medical Symptoms' || medicalConfidence >= 0.70) {
        return {
            pipeline: PIPELINES.MEDICAL,
            reason: 'Physical symptom payload detected above confidence threshold.',
            shouldUpdateMedicalMemory: true
        };
    }

    // 12. General Conversation
    if (intent === 'General Conversation') {
        return {
            pipeline: PIPELINES.GENERAL_CONVERSATION,
            reason: 'Social chit-chat or casual conversation.',
            shouldUpdateMedicalMemory: false
        };
    }

    // Fallback: If user has ongoing symptoms and input confidence is low, don't force medical, route to general conversation or check context
    return {
        pipeline: PIPELINES.UNKNOWN,
        reason: 'Unclassified input. Processing as general conversation.',
        shouldUpdateMedicalMemory: false
    };
}
