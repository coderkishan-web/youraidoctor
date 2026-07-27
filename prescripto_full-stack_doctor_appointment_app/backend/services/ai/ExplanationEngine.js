/**
 * Explanation Engine for AI Medical Companion (Phase 3)
 * Provides supportive, plain-language explanations for recommendations and home care.
 */

export function buildPlainLanguageExplanations(symptoms = [], urgencyTier = '') {
    const explanations = [];

    if (symptoms.some(s => s.toLowerCase().includes('headache') || s.toLowerCase().includes('fever'))) {
        explanations.push("• **Hydration Rationale:** Drinking adequate clean water or electrolyte fluids helps maintain blood volume and ease headaches or fever-induced dehydration.");
        explanations.push("• **Rest Rationale:** Resting in a quiet, dimly lit room reduces sensory stimulation and allows your body to dedicate energy to recovery.");
    }

    if (symptoms.some(s => s.toLowerCase().includes('stomach') || s.toLowerCase().includes('abdominal') || s.toLowerCase().includes('nausea'))) {
        explanations.push("• **Dietary Rationale:** Sticking to bland, easy-to-digest foods (like bananas, rice, or warm broth) prevents irritating the digestive lining.");
    }

    explanations.push("• **Monitoring Rationale:** If your symptoms change significantly or do not improve over 48 hours, consulting a licensed physician ensures you receive a thorough physical examination.");

    return explanations.join('\n');
}
