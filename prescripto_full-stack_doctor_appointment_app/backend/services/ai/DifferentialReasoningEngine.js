/**
 * Differential Reasoning Engine for AI Medical Companion (Phase 3)
 * Synthesizes clinical evidence into ranked differential considerations.
 */

export function generateDifferentialReasoning(symptoms = [], timeline = '', severity = '', correlatedClusters = []) {
    if (!symptoms || symptoms.length === 0) {
        return {
            primaryPossibility: { name: 'General Wellness Inquiry', evidence: 'No acute physical symptoms reported.' },
            secondaryPossibilities: [],
            missingDetails: ['Specific symptoms', 'Duration']
        };
    }

    const primarySym = symptoms[0].toLowerCase();
    let primaryName = 'Primary Clinical Consideration';
    let primaryEvidence = `Reported ${primarySym} with timeline (${timeline || 'onset unspecified'}).`;
    let secondary = [];
    let missingDetails = [];

    if (primarySym.includes('headache')) {
        primaryName = 'Tension-Type Headache or Migraine';
        primaryEvidence = 'Presentation of localized head pain without focal red flags.';
        secondary = [
            { name: 'Sinus Congestion / Sinusitis', evidence: 'If accompanied by nasal pressure or facial tenderness.' },
            { name: 'Stress / Dehydration Induced Headache', evidence: 'Common with low fluid intake or high mental exertion.' }
        ];
        missingDetails = ['Light sensitivity (photophobia)', 'Nausea', 'Exact pain quality (throbbing vs dull pressure)'];
    } else if (primarySym.includes('abdominal') || primarySym.includes('stomach')) {
        primaryName = 'Functional Dyspepsia / Gastroenteritis';
        primaryEvidence = 'Abdominal discomfort without peritoneal signs.';
        secondary = [
            { name: 'Gastric Acid Reflux (GERD)', evidence: 'If pain worsens after meals or lying down.' },
            { name: 'Dietary Intolerance / Cramping', evidence: 'Common with specific food triggers.' }
        ];
        missingDetails = ['Relation to meals', 'Bowel movement changes', 'Exact quadrant location'];
    } else if (primarySym.includes('cough') || primarySym.includes('throat')) {
        primaryName = 'Upper Respiratory Viral Infection (Common Cold / Flu)';
        primaryEvidence = 'Acute onset respiratory discomfort.';
        secondary = [
            { name: 'Acute Bronchitis', evidence: 'If cough persists with phlegm.' },
            { name: 'Environmental Allergic Rhinitis', evidence: 'If accompanied by sneezing or clear discharge.' }
        ];
        missingDetails = ['Mucus color', 'Fever magnitude', 'Wheezing'];
    }

    if (correlatedClusters.length > 0) {
        const topCluster = correlatedClusters[0];
        primaryName = topCluster.name;
        primaryEvidence = `Clinical cluster match: ${topCluster.recommendation}`;
    }

    return {
        primaryPossibility: { name: primaryName, evidence: primaryEvidence },
        secondaryPossibilities: secondary,
        missingDetails
    };
}
