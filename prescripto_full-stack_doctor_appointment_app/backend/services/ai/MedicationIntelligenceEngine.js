/**
 * Medication Intelligence Engine for AI Medical Companion (Phase 3)
 * Tracks user-reported medications and cross-checks known patient allergies.
 */

export function analyzeMedications(medicationsList = [], userAllergies = []) {
    const warnings = [];

    if (!userAllergies || userAllergies.length === 0 || userAllergies.includes('None')) {
        return { warnings, safeStatus: true };
    }

    const allergyStr = userAllergies.join(' ').toLowerCase();

    medicationsList.forEach(med => {
        const medName = (typeof med === 'string' ? med : med.name || '').toLowerCase();
        if (medName && allergyStr.includes(medName)) {
            warnings.push(`🚨 ALLERGY ALERT: Potential conflict detected between reported allergy ("${userAllergies.join(', ')}") and medication "${medName}". Please verify with a doctor or pharmacist immediately.`);
        }
    });

    return {
        warnings,
        safeStatus: warnings.length === 0
    };
}
