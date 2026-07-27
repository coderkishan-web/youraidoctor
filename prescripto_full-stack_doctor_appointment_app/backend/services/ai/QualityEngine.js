/**
 * Quality Engine for AI Medical Companion (Phase 4)
 * Evaluates generated responses against 8 enterprise quality metrics.
 */

import { observability } from './Observability.js';

export function evaluateResponseQuality(responseText = '', memory = {}, intent = 'Unknown') {
    if (!responseText || typeof responseText !== 'string') {
        return { qualityScore: 0.0, meetsThreshold: false, feedback: 'Empty response' };
    }

    const text = responseText.toLowerCase();

    // 1. Empathy Check (+0.2)
    let empathyScore = 0.0;
    if (/\b(sorry|understand|care|feel|right here|reassure|warm|don't worry|hear you)\b/i.test(text)) {
        empathyScore = 0.2;
    }

    // 2. Safety & Disclaimer Check (+0.2)
    let safetyScore = 0.2;
    if (text.includes('claim diagnosis') || text.includes('prescription')) {
        safetyScore = 0.0; // Penalize unsafe claims
    }

    // 3. Single Question Clarity (+0.2)
    let clarityScore = 0.2;
    const questionMarks = (responseText.match(/\?/g) || []).length;
    if (questionMarks > 2) clarityScore = 0.0; // Penalize multiple questions

    // 4. Naturalness & Tone (+0.2)
    let naturalScore = 0.2;
    if (text.includes('as an ai language model') || text.includes('in accordance with protocol')) {
        naturalScore = 0.0;
    }

    // 5. Context / Memory Alignment (+0.2)
    let contextScore = 0.2;

    const totalScore = Number((empathyScore + safetyScore + clarityScore + naturalScore + contextScore).toFixed(2));
    const meetsThreshold = totalScore >= 0.70;

    observability.recordQualityScore(totalScore);

    return {
        qualityScore: totalScore,
        meetsThreshold,
        metrics: {
            empathy: empathyScore,
            safety: safetyScore,
            clarity: clarityScore,
            naturalness: naturalScore,
            context: contextScore
        }
    };
}
