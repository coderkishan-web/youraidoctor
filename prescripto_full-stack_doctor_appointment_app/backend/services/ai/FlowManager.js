/**
 * Flow Manager & Conversation State Engine (Phase 5)
 * Manages explicit state transitions and logs workflow changes.
 */

import { logger } from './Logger.js';

export const STATES = {
    GREETING: 'Greeting',
    ACTIVE_TRIAGE: 'ActiveTriage',
    GENERAL_KNOWLEDGE: 'GeneralKnowledge',
    GENERAL_CONVERSATION: 'GeneralConversation',
    MEDICATION_DISCUSSION: 'MedicationDiscussion',
    WELLNESS_LIFESTYLE: 'WellnessLifestyle',
    APPOINTMENT_ROUTING: 'AppointmentRouting',
    EMERGENCY_INTERCEPT: 'EmergencyIntercept',
    CONTEXT_RECOVERY: 'ContextRecovery',
    AWAITING_SAFE_CONFIRMATION: 'AwaitingSafeConfirmation',
    GOODBYE: 'Goodbye'
};

/**
 * Transitions from currentState to nextState, logging the change.
 */
export function transitionState(currentStage = STATES.GREETING, targetStage = STATES.ACTIVE_TRIAGE, reason = '') {
    if (currentStage !== targetStage) {
        logger.info(`[FlowManager] State Transition: [${currentStage}] ➔ [${targetStage}] | Reason: ${reason}`);
    }
    return {
        previousStage: currentStage,
        currentStage: targetStage,
        transitionTimestamp: new Date().toISOString(),
        reason
    };
}

/**
 * Determines the target state based on intent and topic stack.
 */
export function determineTargetState(intentResult = {}, memory = {}) {
    const { intent, isEmergency } = intentResult;

    if (isEmergency) return STATES.EMERGENCY_INTERCEPT;
    if (intent === 'Greeting') return STATES.GREETING;
    if (intent === 'Goodbye') return STATES.GOODBYE;
    if (intent === 'Appointment Booking' || intent === 'Nearby Hospital') return STATES.APPOINTMENT_ROUTING;
    if (intent === 'Medication Question') return STATES.MEDICATION_DISCUSSION;
    if (intent === 'Nutrition' || intent === 'Lifestyle' || intent === 'Mental Wellness') return STATES.WELLNESS_LIFESTYLE;
    if (intent === 'General Knowledge') return STATES.GENERAL_KNOWLEDGE;
    if (intent === 'General Conversation' || intent === 'Off Topic') return STATES.GENERAL_CONVERSATION;
    if (intent === 'Medical Symptoms' || intent === 'Disease Education') return STATES.ACTIVE_TRIAGE;

    // Check memory context
    if (memory.currentSymptoms && memory.currentSymptoms.length > 0) {
        return STATES.ACTIVE_TRIAGE;
    }

    return STATES.GENERAL_CONVERSATION;
}
