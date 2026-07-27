/**
 * Topic Stack & Context Recovery Engine (Phase 5)
 * Manages topic stacks, side interruptions, context recovery ("continue"),
 * and interpretation of short 1-word user answers.
 */

/**
 * Checks if the user message is asking to resume/continue a previous topic.
 */
export function isRecoveryCommand(message = '') {
    const text = message.trim().toLowerCase();
    const recoveryRegex = /^(continue|go on|proceed|back to (my\s+)?health|back to (my\s+)?symptoms|continue health|as we were saying|where were we|back to headache|back to fever|yes continue|sure continue)\b/i;
    return recoveryRegex.test(text);
}

/**
 * Pushes a new topic onto the topic stack, managing temporary topics during interruptions.
 */
export function pushTopic(memory = {}, newTopic = 'MEDICAL_SYMPTOMS', isTemporary = false) {
    const stack = memory.topicStack || [];
    
    if (isTemporary) {
        return {
            ...memory,
            temporaryTopic: newTopic,
            topicStack: stack.length === 0 ? ['MEDICAL_SYMPTOMS'] : stack
        };
    }

    // Don't duplicate top of stack
    if (stack[stack.length - 1] === newTopic) {
        return { ...memory, temporaryTopic: null };
    }

    return {
        ...memory,
        topicStack: [...stack, newTopic],
        temporaryTopic: null
    };
}

/**
 * Pops or clears temporary topics and recovers the active topic.
 */
export function recoverTopic(memory = {}) {
    const stack = memory.topicStack || [];
    
    // Clear temporary topic
    const updatedTemporary = null;
    const activeTopic = stack.length > 0 ? stack[stack.length - 1] : 'MEDICAL_SYMPTOMS';

    return {
        ...memory,
        temporaryTopic: updatedTemporary,
        activeTopic
    };
}

/**
 * Interprets short one-word or brief replies based on the last question asked.
 * Examples: "4", "yes", "no", "today", "left", "mild"
 */
export function interpretShortAnswer(message = '', memory = {}) {
    const text = message.trim();
    const lowerText = text.toLowerCase();
    const lastQuestion = (memory.lastQuestionAsked || '').toLowerCase();

    // Check if it's a short input (1-3 words)
    if (text.split(/\s+/).length > 4) {
        return { isShortAnswer: false, interpretedData: null };
    }

    // 1. Pure numbers ("4", "3", "2")
    if (/^\d+$/.test(text)) {
        const num = text;
        if (lastQuestion.includes('how long') || lastQuestion.includes('duration') || lastQuestion.includes('days') || lastQuestion.includes('hours')) {
            return {
                isShortAnswer: true,
                interpretedData: { type: 'duration', value: `${num} days`, formatted: `Duration reported as ${num} days.` }
            };
        }
        if (lastQuestion.includes('scale') || lastQuestion.includes('1 to 10') || lastQuestion.includes('severity')) {
            return {
                isShortAnswer: true,
                interpretedData: { type: 'severity', value: `${num}/10`, formatted: `Severity rated ${num}/10.` }
            };
        }
    }

    // 2. Affirmation / Negation ("yes", "no", "yeah", "nope")
    if (/^(yes|yeah|yep|sure|ha|haa|correct|true)$/i.test(lowerText)) {
        if (lastQuestion.includes('fever') || lastQuestion.includes('chills')) {
            return {
                isShortAnswer: true,
                interpretedData: { type: 'fever', value: true, formatted: 'Fever present.' }
            };
        }
        return {
            isShortAnswer: true,
            interpretedData: { type: 'affirmation', value: true, formatted: 'User affirmed previous point.' }
        };
    }

    if (/^(no|nope|na|nah|false|never)$/i.test(lowerText)) {
        if (lastQuestion.includes('fever')) {
            return {
                isShortAnswer: true,
                interpretedData: { type: 'fever', value: false, formatted: 'No fever.' }
            };
        }
        return {
            isShortAnswer: true,
            interpretedData: { type: 'negation', value: false, formatted: 'User denied previous point.' }
        };
    }

    // 3. Severity words ("mild", "moderate", "severe", "bad")
    if (/^(mild|moderate|severe|unbearable|intense|sharp|dull)$/i.test(lowerText)) {
        return {
            isShortAnswer: true,
            interpretedData: { type: 'severity', value: lowerText, formatted: `Severity described as ${lowerText}.` }
        };
    }

    // 4. Timeline words ("today", "yesterday", "since morning", "few days")
    if (/^(today|yesterday|this morning|since morning|a week|few days)$/i.test(lowerText)) {
        return {
            isShortAnswer: true,
            interpretedData: { type: 'duration', value: lowerText, formatted: `Timeline reported as ${lowerText}.` }
        };
    }

    // 5. Body locations ("left", "right", "stomach", "chest", "head", "back")
    if (/^(left|right|head|stomach|chest|back|neck|arm|leg|throat)$/i.test(lowerText)) {
        return {
            isShortAnswer: true,
            interpretedData: { type: 'painLocation', value: lowerText, formatted: `Location specified as ${lowerText}.` }
        };
    }

    return { isShortAnswer: false, interpretedData: null };
}
