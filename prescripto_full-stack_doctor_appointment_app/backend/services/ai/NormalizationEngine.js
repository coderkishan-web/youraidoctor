/**
 * Normalization Engine for AI Medical Companion (Phase 3)
 * Normalizes colloquial patient expressions, typos, and multilingual terms
 * into standard clinical terminology.
 */

const MEDICAL_DICTIONARY = [
    {
        standardTerm: 'Headache',
        patterns: [/head is killing me/i, /sar dard/i, /doka dukhtay/i, /dokadukhi/i, /headache/i, /head pain/i, /throbbing head/i]
    },
    {
        standardTerm: 'Abdominal Pain',
        patterns: [/tummy hurts/i, /stomach ache/i, /pet dard/i, /potat dukhat/i, /stomach pain/i, /belly ache/i, /abdominal pain/i, /cramps in stomach/i]
    },
    {
        standardTerm: 'Nausea / Vomiting',
        patterns: [/feel like throwing up/i, /puking/i, /ulti/i, /nausea/i, /vomit/i, /queasy/i, /throwing up/i]
    },
    {
        standardTerm: 'Shortness of Breath',
        patterns: [/can't catch breath/i, /cannot breathe/i, /saans nahi aa rahi/i, /breathless/i, /shortness of breath/i, /gasping/i, /wheezing/i]
    },
    {
        standardTerm: 'Dysuria',
        patterns: [/burning when peeing/i, /painful urination/i, /pee hurts/i, /burning sensation in urine/i]
    },
    {
        standardTerm: 'Fever',
        patterns: [/high temp/i, /taap/i, /bukhar/i, /chills/i, /running fever/i, /body hot/i, /fever/i]
    },
    {
        standardTerm: 'Diarrhea',
        patterns: [/loose motions/i, /watery stool/i, /diarrhea/i, /diarrhoea/i, /upset stomach/i]
    },
    {
        standardTerm: 'Chest Pain',
        patterns: [/seene me dard/i, /chatit dukhat/i, /chest pain/i, /chest tightness/i, /pressure in chest/i]
    },
    {
        standardTerm: 'Fatigue',
        patterns: [/extremely tired/i, /no energy/i, /fatigue/i, /exhausted/i, /thakwa/i]
    },
    {
        standardTerm: 'Sore Throat',
        patterns: [/throat pain/i, /gala kharab/i, /gala dard/i, /scratchy throat/i, /sore throat/i]
    }
];

/**
 * Normalizes text to extract clinical symptom terms.
 */
export function normalizeSymptomTerms(text = '') {
    if (!text || typeof text !== 'string') return [];

    const normalized = [];

    MEDICAL_DICTIONARY.forEach(({ standardTerm, patterns }) => {
        if (patterns.some(pattern => pattern.test(text))) {
            if (!normalized.includes(standardTerm)) {
                normalized.push(standardTerm);
            }
        }
    });

    return normalized;
}

/**
 * Normalizes single term string if matched.
 */
export function normalizeSingleTerm(term = '') {
    const text = term.trim();
    for (const { standardTerm, patterns } of MEDICAL_DICTIONARY) {
        if (patterns.some(p => p.test(text))) {
            return standardTerm;
        }
    }
    return text.charAt(0).toUpperCase() + text.slice(1);
}
