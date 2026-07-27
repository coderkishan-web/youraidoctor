/**
 * Clinical Correlation Engine for AI Medical Companion (Phase 3)
 * Analyzes symptom clusters and multi-symptom combinations for clinical triage synergy.
 */

export const CLINICAL_CLUSTERS = [
    {
        name: 'Potential Meningeal / Neurological Emergency',
        symptomsRequired: ['Headache', 'Fever'],
        additionalKeywords: ['neck stiffness', 'stiff neck', 'light sensitivity', 'photophobia', 'confusion'],
        urgency: 'Emergency Care',
        recommendation: 'Immediate Emergency ER Evaluation required to rule out meningitis or severe intracranial condition.'
    },
    {
        name: 'Potential Acute Coronary / Cardiac Event',
        symptomsRequired: ['Chest Pain'],
        additionalKeywords: ['shortness of breath', 'left arm', 'jaw pain', 'sweating', 'dizziness'],
        urgency: 'Emergency Care',
        recommendation: 'Immediate ER / Cardiac Evaluation required.'
    },
    {
        name: 'Potential Appendicitis / Acute Abdomen',
        symptomsRequired: ['Abdominal Pain'],
        additionalKeywords: ['lower right', 'right lower', 'nausea', 'fever', 'rebound tenderness'],
        urgency: 'Urgent Care',
        recommendation: 'Urgent Same-Day Abdominal Ultrasound & Surgical Evaluation recommended.'
    },
    {
        name: 'Lower Respiratory Tract Infection / Pneumonia',
        symptomsRequired: ['Shortness of Breath'],
        additionalKeywords: ['fever', 'cough', 'chest pain', 'mucus', 'phlegm'],
        urgency: 'Urgent Care',
        recommendation: 'Prompt Clinical Evaluation & Chest Auscultation/X-ray advised.'
    }
];

/**
 * Analyzes symptoms & text to identify correlated clinical syndromes.
 */
export function correlateSymptoms(symptoms = [], userText = '') {
    const textLower = userText.toLowerCase();
    const matchedClusters = [];

    CLINICAL_CLUSTERS.forEach(cluster => {
        const hasCoreSymptom = cluster.symptomsRequired.some(s => 
            symptoms.some(userSym => userSym.toLowerCase().includes(s.toLowerCase()))
        );

        if (hasCoreSymptom) {
            const hasAdditionalSign = cluster.additionalKeywords.some(kw => textLower.includes(kw));
            if (hasAdditionalSign) {
                matchedClusters.push(cluster);
            }
        }
    });

    return matchedClusters;
}
