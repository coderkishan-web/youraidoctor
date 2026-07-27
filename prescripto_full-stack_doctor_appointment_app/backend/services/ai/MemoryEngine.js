/**
 * Memory Engine for AI Medical Companion
 * Maintains structured health context, tracks unanswered questions, and calculates information confidence levels.
 */

export function createInitialMemory() {
    return {
        currentSymptoms: [],
        symptomTimeline: '',
        duration: '',
        painLocation: '',
        severity: null,
        fever: false,
        medications: [],
        allergies: [],
        chronicDiseases: [],
        pastHistory: [],
        lifestyle: '',
        emergencyScore: 0,
        conversationStage: 'Greeting',
        lastQuestionAsked: '',
        lastIntent: 'Greeting',
        pendingInformation: ['duration', 'severity', 'painLocation', 'associatedSymptoms'],
        completedQuestions: [],
        unansweredQuestions: [],
        confidenceLevel: 0.0 // 0.0 to 1.0 scale
    };
}

/**
 * Updates structured memory and re-evaluates confidence score.
 */
export function updateMemory(message = '', existingMemory = {}, userProfile = {}, intent = 'Unknown') {
    const memory = {
        ...createInitialMemory(),
        ...existingMemory
    };

    memory.lastIntent = intent;
    const text = message.toLowerCase();

    // 1. Symptom Extraction
    const symptomKeywords = [
        'headache', 'fever', 'cough', 'cold', 'stomach pain', 'chest pain',
        'nausea', 'vomiting', 'diarrhea', 'back pain', 'joint pain', 'sore throat',
        'dizziness', 'fatigue', 'rash', 'cramps', 'shortness of breath'
    ];

    symptomKeywords.forEach(sym => {
        if (text.includes(sym) && !memory.currentSymptoms.includes(sym)) {
            memory.currentSymptoms.push(sym);
        }
    });

    // 2. Duration / Timeline Extraction
    const durationRegex = /\b(\d+\s*(days?|hours?|weeks?|months?)|since yesterday|since morning|few days|for a week)\b/i;
    const durationMatch = text.match(durationRegex);
    if (durationMatch) {
        memory.symptomTimeline = durationMatch[0];
        memory.duration = durationMatch[0];
        memory.pendingInformation = memory.pendingInformation.filter(p => p !== 'duration');
        if (!memory.completedQuestions.includes('duration')) memory.completedQuestions.push('duration');
    }

    // 3. Pain Location
    const bodyParts = ['head', 'chest', 'stomach', 'abdomen', 'back', 'neck', 'arm', 'leg', 'throat', 'eye', 'ear'];
    bodyParts.forEach(part => {
        if (text.includes(part) && !memory.painLocation.includes(part)) {
            memory.painLocation = memory.painLocation ? `${memory.painLocation}, ${part}` : part;
            memory.pendingInformation = memory.pendingInformation.filter(p => p !== 'painLocation');
            if (!memory.completedQuestions.includes('painLocation')) memory.completedQuestions.push('painLocation');
        }
    });

    // 4. Severity Extraction
    const severityRegex = /\b(mild|moderate|severe|unbearable|10\/10|8\/10|5\/10|3\/10|intense|sharp|dull)\b/i;
    const severityMatch = text.match(severityRegex);
    if (severityMatch) {
        memory.severity = severityMatch[0];
        memory.pendingInformation = memory.pendingInformation.filter(p => p !== 'severity');
        if (!memory.completedQuestions.includes('severity')) memory.completedQuestions.push('severity');
    }

    // 5. Fever Detection
    if (/\b(fever|tap|taap|temperature|chills|high temp|101|102|100|99)\b/i.test(text)) {
        memory.fever = true;
        if (!memory.completedQuestions.includes('fever')) memory.completedQuestions.push('fever');
    }

    // 6. User Profile Sync
    if (userProfile.healthProfile) {
        const hp = userProfile.healthProfile;
        if (hp.medicationsAllergies && hp.medicationsAllergies !== 'None') {
            memory.allergies = Array.from(new Set([...memory.allergies, hp.medicationsAllergies]));
        }
        if (hp.healthHistory && hp.healthHistory !== 'None') {
            memory.chronicDiseases = Array.from(new Set([...memory.chronicDiseases, hp.healthHistory]));
        }
    }

    // 7. Calculate Confidence Level (0.0 to 1.0)
    let score = 0;
    if (memory.currentSymptoms.length > 0) score += 0.3;
    if (memory.symptomTimeline || memory.duration) score += 0.25;
    if (memory.severity) score += 0.25;
    if (memory.painLocation) score += 0.2;
    memory.confidenceLevel = Math.min(1.0, score);

    // 8. Update Stage Progression
    if (memory.currentSymptoms.length > 0) {
        if (memory.confidenceLevel < 0.5) {
            memory.conversationStage = 'ClarifyMissingInformation';
        } else if (memory.confidenceLevel < 0.8) {
            memory.conversationStage = 'AssessSituation';
        } else {
            memory.conversationStage = 'ProvideGuidance';
        }
    }

    return memory;
}
