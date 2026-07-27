/**
 * Question Planner for AI Medical Companion
 * Enforces the ONE Question Rule: Never ask multiple questions together.
 * Generates single high-value questions adapted to context signals ("I don't know", "Skip", "What?").
 */

import { USER_SIGNALS } from './ContextEngine.js';

export function planNextQuestion(memory = {}, userProfile = {}, contextAnalysis = {}) {
    const { userSignal, missingInfo } = contextAnalysis;
    const symptoms = memory.currentSymptoms || [];
    const primarySymptom = symptoms[0] || 'discomfort';

    // 1. Handle "I don't know" / "Not sure" signal
    if (userSignal === USER_SIGNALS.DONT_KNOW) {
        return `That's completely okay! We don't need exact details. In simple terms, is the ${primarySymptom} mild, or is it making it hard to go about your day?`;
    }

    // 2. Handle "Skip" signal
    if (userSignal === USER_SIGNALS.SKIP) {
        return `No problem at all, we can skip that! Have you noticed any fever, chills, or nausea along with your ${primarySymptom}?`;
    }

    // 3. Handle "What?" / "Explain" signal
    if (userSignal === USER_SIGNALS.EXPLAIN) {
        return `I'm happy to clarify! I was asking if your ${primarySymptom} feels like a dull pressure or a sharp throbbing pain. How would you describe it?`;
    }

    if (symptoms.length === 0) {
        return "Can you tell me a bit more about what symptoms or discomfort you are experiencing today?";
    }

    // Priority 1: Duration
    if ((missingInfo && missingInfo.includes('duration')) || (!memory.symptomTimeline && !memory.duration)) {
        return `When did the ${primarySymptom} start? (For example: this morning, 2 days ago, etc.)`;
    }

    // Priority 2: Severity
    if ((missingInfo && missingInfo.includes('severity')) || !memory.severity) {
        return `On a scale of 1 to 10 (or as mild, moderate, or severe), how intense would you say the ${primarySymptom} is?`;
    }

    // Priority 3: Pain location / specific traits
    if (primarySymptom.includes('headache') && !memory.painLocation) {
        return `Is the headache focused on one side of your head or all over?`;
    }

    if (primarySymptom.includes('stomach') || primarySymptom.includes('pain')) {
        return `Is the pain continuous, or does it come and go in waves?`;
    }

    return `Have you noticed any other symptoms accompanied with your ${primarySymptom}, such as fever or nausea?`;
}
