/**
 * Medical Reasoning Engine for AI Medical Companion
 * Synthesizes clinical evidence without making false diagnoses.
 */

export function evaluateClinicalEvidence(memory = {}, datasetContext = '') {
    const symptoms = memory.currentSymptoms || [];
    const timeline = memory.symptomTimeline || '';
    const severity = memory.severity || '';
    const fever = memory.fever || false;

    let riskBadge = '🟢 Low Risk';
    let riskLevel = 'Low';
    let recommendedSpecialty = 'General Physician';
    let bookingAction = false;
    let confidence = 0.6; // Base confidence

    if (symptoms.length === 0) {
        return {
            riskBadge: '🟢 General Wellness',
            riskLevel: 'Low',
            recommendedSpecialty: 'General Physician',
            confidence: 0.5,
            possibleCauses: ['Wellness Inquiry'],
            isSufficient: false
        };
    }

    const symptomStr = symptoms.join(' ').toLowerCase();

    // Chest / Heart / Angina
    if (symptomStr.includes('chest') || symptomStr.includes('heart')) {
        riskBadge = '🔴 High Risk';
        riskLevel = 'High';
        recommendedSpecialty = 'Cardiologist';
        bookingAction = true;
        confidence = 0.85;
    }
    // Severe Headache / Vision / Neurological
    else if (symptomStr.includes('headache') && (symptomStr.includes('dizzy') || symptomStr.includes('vision') || fever)) {
        riskBadge = '🟡 Moderate Risk';
        riskLevel = 'Moderate';
        recommendedSpecialty = 'Neurologist';
        bookingAction = true;
        confidence = 0.75;
    }
    // Gastrointestinal / Severe Abdominal
    else if (symptomStr.includes('stomach') || symptomStr.includes('cramps') || symptomStr.includes('vomiting')) {
        if (fever || (severity && severity.includes('severe'))) {
            riskBadge = '🟡 Moderate Risk';
            riskLevel = 'Moderate';
            recommendedSpecialty = 'Gastroenterologist';
            bookingAction = true;
        } else {
            riskBadge = '🟢 Mild / Moderate Risk';
            riskLevel = 'Low-Moderate';
            recommendedSpecialty = 'General Physician';
        }
        confidence = 0.70;
    }
    // Respiratory / Flu / Cough
    else if (symptomStr.includes('cough') || symptomStr.includes('cold') || symptomStr.includes('throat')) {
        if (fever) {
            riskBadge = '🟡 Moderate Risk';
            riskLevel = 'Moderate';
            recommendedSpecialty = 'Pulmonologist / General Physician';
        } else {
            riskBadge = '🟢 Low Risk';
            riskLevel = 'Low';
            recommendedSpecialty = 'General Physician';
        }
        confidence = 0.80;
    }

    const isSufficient = symptoms.length >= 2 && Boolean(timeline);

    return {
        riskBadge,
        riskLevel,
        recommendedSpecialty,
        bookingAction,
        confidence,
        isSufficient,
        possibleCauses: datasetContext.includes('Possible Causes:') 
            ? datasetContext.split('Possible Causes:')[1].split('|')[0].trim().split(',')
            : ['Viral Syndrome', 'Stress / Fatigue', 'Mild Infection']
    };
}
