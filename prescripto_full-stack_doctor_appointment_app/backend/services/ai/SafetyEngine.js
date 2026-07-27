/**
 * Safety Engine for AI Medical Companion
 * Identifies high-risk medical emergencies instantly and provides life-saving guidance.
 */

export const EMERGENCY_TYPES = {
    CHEST_PAIN: 'Chest Pain / Potential Cardiac Event',
    BREATHING: 'Severe Breathing Difficulty / Airway Compromise',
    STROKE: 'Stroke Symptoms (F.A.S.T.)',
    UNCONSCIOUS: 'Loss of Consciousness / Head Trauma',
    POISONING: 'Toxic Ingestion / Poisoning / Overdose',
    BLEEDING: 'Severe Uncontrollable Bleeding',
    ANAPHYLAXIS: 'Severe Allergic Reaction / Anaphylaxis',
    SUICIDE: 'Mental Health Crisis / Self-Harm'
};

/**
 * Assess message & current memory for immediate emergency red flags.
 * Returns { isEmergency: boolean, type: string|null, response: object|null }
 */
export function assessEmergency(message = '', memory = {}) {
    const text = message.toLowerCase();

    let detectedType = null;

    if (/\b(chest pain|heart attack|seene me dard|chhati me dard|crushing chest pain|pressure in chest|pain radiating to arm|pain radiating to jaw)\b/i.test(text)) {
        detectedType = EMERGENCY_TYPES.CHEST_PAIN;
    } else if (/\b(can't breathe|cannot breathe|gasping for air|shortness of breath|choking|airway closing|breathless|saans nahi aa rahi)\b/i.test(text)) {
        detectedType = EMERGENCY_TYPES.BREATHING;
    } else if (/\b(stroke|face drooping|arm weakness|slurred speech|sudden numbness|one side paralyzed)\b/i.test(text)) {
        detectedType = EMERGENCY_TYPES.STROKE;
    } else if (/\b(unconscious|passed out|fainted|blacked out|unresponsive|head trauma|seizure|convulsions)\b/i.test(text)) {
        detectedType = EMERGENCY_TYPES.UNCONSCIOUS;
    } else if (/\b(poison|poisoning|swallowed bleach|swallowed pesticide|chemical ingestion|drug overdose|swallowed pills)\b/i.test(text)) {
        detectedType = EMERGENCY_TYPES.POISONING;
    } else if (/\b(bleeding profusely|severe bleeding|gushing blood|uncontrollable bleeding)\b/i.test(text)) {
        detectedType = EMERGENCY_TYPES.BLEEDING;
    } else if (/\b(anaphylaxis|throat swelling|severe allergy rash|can't breathe allergy|epi pen)\b/i.test(text)) {
        detectedType = EMERGENCY_TYPES.ANAPHYLAXIS;
    } else if (/\b(suicide|suicidal|want to die|end my life|kill myself|self-harm)\b/i.test(text)) {
        detectedType = EMERGENCY_TYPES.SUICIDE;
    }

    if (!detectedType) {
        return { isEmergency: false, type: null, response: null };
    }

    // Emergency Response Payload
    let guidance = "";
    let helplines = [];

    if (detectedType === EMERGENCY_TYPES.SUICIDE) {
        guidance = "I am deeply concerned about you, and your safety is the absolute priority right now. Please know that you are not alone and there is compassionate help available 24/7.";
        helplines = [
            "National Suicide & Crisis Lifeline: Dial 988 (US/Canada)",
            "KIRAN Mental Health Helpline (India): 1800-599-0019",
            "Tele-MANAS (India): 14416 / 1800 891 4416",
            "Vandrevala Foundation Helpline: +91 9999 666 555"
        ];
    } else {
        guidance = `🚨 **EMERGENCY WARNING**: The symptoms described (${detectedType}) require **IMMEDIATE medical evaluation**. Please do NOT wait or rely on online advice. Seek emergency emergency room (ER) care right away.`;
        helplines = [
            "National Emergency Medical Services (India): 108 / 112",
            "Ambulance Direct: 102",
            "US/Canada Emergency Services: 911",
            "UK Emergency Services: 999 / 111"
        ];
    }

    const replyText = `${guidance}\n\n**Immediate Action Plan:**\n1. **Call Emergency Services immediately** or have someone drive you to the nearest hospital emergency department.\n2. Stay calm, sit down in a comfortable position, and rest.\n3. Do not ingest food, drinks, or self-medicate while waiting.\n\n**Emergency Contact Numbers:**\n${helplines.map(h => `• ${h}`).join('\n')}\n\n*Our team has flagged this session as Critical Risk.*`;

    return {
        isEmergency: true,
        type: detectedType,
        response: {
            reply: replyText,
            riskBadge: '🚨 CRITICAL EMERGENCY',
            recommendedSpecialty: 'Emergency Medicine / Trauma Center',
            bookingAction: true,
            isEmergency: true
        }
    };
}
