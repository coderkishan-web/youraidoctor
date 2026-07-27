/**
 * Medical Entity Extraction Engine for AI Medical Companion (Phase 3)
 * Extracts structured medical entities (symptoms, vitals, timeline, meds, dosages, habits)
 * from natural language user input.
 */

import { normalizeSymptomTerms } from './NormalizationEngine.js';

export function extractMedicalEntities(text = '', existingEntities = {}) {
    if (!text || typeof text !== 'string') return existingEntities;

    const lower = text.toLowerCase();

    // 1. Normalized Symptoms
    const extractedSymptoms = normalizeSymptomTerms(text);

    // 2. Timeline / Duration
    const durationRegex = /\b(\d+\s*(days?|hours?|weeks?|months?)|since yesterday|since morning|few days|for a week)\b/i;
    const durationMatch = text.match(durationRegex);
    const duration = durationMatch ? durationMatch[0] : (existingEntities.duration || '');

    // 3. Severity
    const severityRegex = /\b(mild|moderate|severe|unbearable|10\/10|8\/10|5\/10|3\/10|intense|sharp|dull)\b/i;
    const severityMatch = text.match(severityRegex);
    const severity = severityMatch ? severityMatch[0] : (existingEntities.severity || '');

    // 4. Pain Location & Radiation
    let painLocation = existingEntities.painLocation || '';
    const bodyParts = ['head', 'chest', 'stomach', 'abdomen', 'back', 'neck', 'left arm', 'right arm', 'leg', 'throat', 'eye', 'temple', 'lower right abdomen'];
    bodyParts.forEach(part => {
        if (lower.includes(part) && !painLocation.includes(part)) {
            painLocation = painLocation ? `${painLocation}, ${part}` : part;
        }
    });

    let radiation = existingEntities.radiation || '';
    if (/\b(radiating to|spreading to|going down to)\b/i.test(lower)) {
        const radMatch = lower.match(/\b(radiating to|spreading to|going down to)\s+([a-z\s]+)/i);
        if (radMatch && radMatch[2]) {
            radiation = radMatch[2].trim();
        }
    }

    // 5. Vitals Extraction (Temperature, Heart Rate, BP)
    const tempRegex = /\b(10[0-6]\.?\d?|99\.?\d?|101|102|103|104|105)\s*(°?f|fahrenheit|degrees)?\b/i;
    const tempMatch = text.match(tempRegex);
    const temperature = tempMatch ? tempMatch[0] : (existingEntities.vitals?.temperature || null);

    const bpRegex = /\b(1[0-9]{2}|2[0-0]{2}|[8-9][0-9])\s*\/\s*(1[0-1][0-9]|[6-9][0-9])\b/;
    const bpMatch = text.match(bpRegex);
    const bloodPressure = bpMatch ? bpMatch[0] : (existingEntities.vitals?.bloodPressure || null);

    // 6. Medication & Dosage Extraction
    const medsList = existingEntities.medications || [];
    const medRegex = /\b(taking|on|took)\s+([0-9]+\s*(mg|g|ml)\s+)?([a-z]+)\b/i;
    const medMatch = text.match(medRegex);
    if (medMatch && medMatch[4] && !['the', 'a', 'some', 'my', 'few'].includes(medMatch[4])) {
        const medName = medMatch[4];
        const dose = medMatch[2] ? medMatch[2].trim() : 'Unspecified dose';
        medsList.push({ name: medName, dose });
    }

    // 7. Habits (Smoking, Alcohol, Travel)
    const habits = existingEntities.habits || { smoking: false, alcohol: false, travel: null };
    if (/\b(smoking|smoker|cigarettes)\b/i.test(lower)) habits.smoking = true;
    if (/\b(alcohol|drinking|liquor)\b/i.test(lower)) habits.alcohol = true;

    return {
        symptoms: Array.from(new Set([...(existingEntities.symptoms || []), ...extractedSymptoms])),
        duration,
        severity,
        painLocation,
        radiation,
        vitals: {
            temperature,
            bloodPressure
        },
        medications: medsList,
        habits
    };
}
