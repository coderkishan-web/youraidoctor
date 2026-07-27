/**
 * Response Planner Engine (Phase 5)
 * Decides response strategy and manages natural opening phrase variations.
 */

export const STRATEGIES = {
    ANSWER_DIRECTLY: 'ANSWER_DIRECTLY',
    ASK_ONE_QUESTION: 'ASK_ONE_QUESTION',
    EXPLAIN_CONCEPT: 'EXPLAIN_CONCEPT',
    CLARIFY_INPUT: 'CLARIFY_INPUT',
    RECOMMEND_SPECIALIST: 'RECOMMEND_SPECIALIST',
    ESCALATE_EMERGENCY: 'ESCALATE_EMERGENCY',
    RETURN_TO_PREVIOUS_TOPIC: 'RETURN_TO_PREVIOUS_TOPIC'
};

const OPENING_VARIATIONS = [
    'Absolutely.',
    'Sure.',
    'Of course.',
    'Happy to help.',
    "Let's look into that.",
    'Thanks for letting me know.',
    'I understand.',
    'I see.',
    'Got it.'
];

let openingIndex = 0;

/**
 * Returns a rotated natural opening phrase.
 */
export function getNextOpeningPhrase() {
    const phrase = OPENING_VARIATIONS[openingIndex % OPENING_VARIATIONS.length];
    openingIndex++;
    return phrase;
}

/**
 * Decides the response strategy based on pipeline, memory, and intent.
 */
export function planResponseStrategy({ pipelineRoute = {}, memory = {}, intentResult = {} }) {
    const { pipeline, hasPendingMedicalTopic, isContextRecovery } = pipelineRoute;

    if (pipeline === 'EMERGENCY_PIPELINE') {
        return {
            strategy: STRATEGIES.ESCALATE_EMERGENCY,
            instruction: 'Urgent emergency triage instructions. Keep calm, clear, direct. Provide emergency numbers (108/112).'
        };
    }

    if (isContextRecovery) {
        return {
            strategy: STRATEGIES.RETURN_TO_PREVIOUS_TOPIC,
            opening: getNextOpeningPhrase(),
            instruction: 'Resume previous medical symptom discussion seamlessly where it stopped.'
        };
    }

    if (pipeline === 'GENERAL_KNOWLEDGE_PIPELINE' || pipeline === 'OFF_TOPIC_PIPELINE') {
        return {
            strategy: STRATEGIES.ANSWER_DIRECTLY,
            opening: getNextOpeningPhrase(),
            instruction: hasPendingMedicalTopic
                ? 'Answer the user question directly in 2-3 sentences. End with a polite offer: "If you\'d like, we can continue discussing your health whenever you\'re ready."'
                : 'Answer the user question directly and concisely in 2-3 sentences.'
        };
    }

    if (pipeline === 'MEDICAL_PIPELINE') {
        if (memory.confidenceLevel >= 0.8) {
            return {
                strategy: STRATEGIES.RECOMMEND_SPECIALIST,
                opening: getNextOpeningPhrase(),
                instruction: 'Provide clear triage summary, clinical considerations, and 1 targeted follow-up question or specialist recommendation.'
            };
        }
        return {
            strategy: STRATEGIES.ASK_ONE_QUESTION,
            opening: getNextOpeningPhrase(),
            instruction: 'Acknowledge reported symptoms warmly. Ask EXACTLY ONE high-value follow-up question.'
        };
    }

    return {
        strategy: STRATEGIES.ANSWER_DIRECTLY,
        opening: getNextOpeningPhrase(),
        instruction: 'Respond naturally, warmly, and helpfully.'
    };
}
