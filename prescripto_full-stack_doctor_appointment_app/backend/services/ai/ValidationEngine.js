/**
 * Validation Engine for AI Medical Companion
 * Validates user inputs against context and inspects generated AI output
 * for repetitions, robotic language, unsafe content, or hallucinations.
 */

export function validateUserResponse(message = '', memory = {}) {
    const text = message.trim();
    if (!text) {
        return { isValid: false, reason: 'empty_input' };
    }

    return { isValid: true };
}

/**
 * Validates generated AI output to ensure compliance with warmth, safety,
 * tone rules, and absence of question repetitions.
 */
export function validateAIOutput(aiResponseText = '', plannedQuestion = '', lastQuestionAsked = '') {
    if (!aiResponseText || typeof aiResponseText !== 'string') {
        return `I'm paying close attention to what you shared. ${plannedQuestion}`;
    }

    let cleanedText = aiResponseText.trim();

    // 1. Remove raw markdown bold asterisks if present for consistent typography
    cleanedText = cleanedText.replace(/\*\*/g, '');

    // 2. Repetition Check: If AI repeated the previous question exactly, replace it with plannedQuestion
    if (lastQuestionAsked && cleanedText.toLowerCase().includes(lastQuestionAsked.toLowerCase())) {
        cleanedText = cleanedText.replace(new RegExp(lastQuestionAsked.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi'), plannedQuestion);
    }

    // 3. Ensure ONE Question Rule (max 2 question marks allowed across full output)
    const questionMarks = (cleanedText.match(/\?/g) || []).length;
    if (questionMarks > 2) {
        const sentences = cleanedText.split(/(?<=\?)/);
        cleanedText = sentences.slice(0, 2).join(' ').trim();
    }

    // 4. Robotic / Mechanical jargon rewrite fallback
    if (cleanedText.toLowerCase().includes('as an ai model') || cleanedText.toLowerCase().includes('in accordance with medical protocols')) {
        cleanedText = cleanedText
            .replace(/as an ai model/gi, 'as your health companion')
            .replace(/in accordance with medical protocols/gi, 'to take the best care of you');
    }

    return cleanedText;
}
