/**
 * Context Engine for AI Medical Companion
 * Analyzes conversation context, tracks answered vs missing information,
 * and detects special user signals ("I don't know", "Skip", "What? / Explain").
 */

export const USER_SIGNALS = {
    NORMAL: 'NORMAL',
    DONT_KNOW: 'DONT_KNOW',
    SKIP: 'SKIP',
    EXPLAIN: 'EXPLAIN'
};

/**
 * Analyzes user input in relation to current memory state.
 */
export function analyzeContext(userMessage = '', memory = {}) {
    const text = userMessage.trim().toLowerCase();

    let userSignal = USER_SIGNALS.NORMAL;

    // Detect "I don't know" / "Not sure"
    if (/\b(i don't know|idk|dont know|not sure|no idea|can't tell|cant tell|hard to say)\b/i.test(text)) {
        userSignal = USER_SIGNALS.DONT_KNOW;
    }
    // Detect "Skip" / "Pass"
    else if (/\b(skip|pass|move on|next question|don't want to answer|dont want to answer)\b/i.test(text) && text.split(' ').length <= 4) {
        userSignal = USER_SIGNALS.SKIP;
    }
    // Detect "What?" / "Explain" / "Why"
    else if (/\b(what do you mean|what\?|explain|why|what does that mean|i don't understand|dont understand)\b/i.test(text)) {
        userSignal = USER_SIGNALS.EXPLAIN;
    }

    // Determine what has already been answered
    const alreadyAnswered = [];
    if (memory.currentSymptoms && memory.currentSymptoms.length > 0) alreadyAnswered.push('symptoms');
    if (memory.symptomTimeline || memory.duration) alreadyAnswered.push('duration');
    if (memory.severity) alreadyAnswered.push('severity');
    if (memory.painLocation) alreadyAnswered.push('painLocation');
    if (memory.fever !== undefined && memory.fever !== null) alreadyAnswered.push('fever');
    if (memory.medications && memory.medications.length > 0) alreadyAnswered.push('medications');
    if (memory.allergies && memory.allergies.length > 0) alreadyAnswered.push('allergies');

    // Filter pending information to ensure NO duplicate questions
    const allRequired = ['symptoms', 'duration', 'severity', 'painLocation', 'associatedSymptoms'];
    const missingInfo = allRequired.filter(item => !alreadyAnswered.includes(item) && !(memory.unansweredQuestions || []).includes(item));

    return {
        userSignal,
        alreadyAnswered,
        missingInfo,
        lastQuestion: memory.lastQuestionAsked || memory.lastQuestion || ''
    };
}
