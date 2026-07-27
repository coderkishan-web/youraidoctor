/**
 * Urgency Risk Engine for AI Medical Companion (Phase 3)
 * Classifies clinical urgency into 5 distinct triage tiers.
 */

export const URGENCY_TIERS = {
    SELF_CARE: 'Self-care appropriate',
    PRIMARY_CARE: 'Primary Care',
    SAME_DAY: 'Same-day Evaluation',
    URGENT_CARE: 'Urgent Care',
    EMERGENCY: 'Emergency Care'
};

export function assessUrgencyTier(symptoms = [], severity = '', fever = false, correlatedClusters = []) {
    // 1. Emergency Tier Check
    if (correlatedClusters.some(c => c.urgency === 'Emergency Care')) {
        return {
            tier: URGENCY_TIERS.EMERGENCY,
            badge: '🚨 Critical Emergency',
            recommendedAction: 'Visit nearest Hospital Emergency Room (ER) or call Emergency Helpline (108/112/911).'
        };
    }

    const symptomStr = symptoms.join(' ').toLowerCase();

    if (symptomStr.includes('chest') || symptomStr.includes('shortness of breath')) {
        return {
            tier: URGENCY_TIERS.EMERGENCY,
            badge: '🔴 Emergency Care Required',
            recommendedAction: 'Immediate ER / Cardiac Evaluation.'
        };
    }

    // 2. Urgent Care Tier Check
    if (correlatedClusters.some(c => c.urgency === 'Urgent Care') || severity.includes('severe') || severity.includes('8/') || severity.includes('10/')) {
        return {
            tier: URGENCY_TIERS.URGENT_CARE,
            badge: '🟡 Urgent Care Recommended',
            recommendedAction: 'Consult a specialist doctor or visit urgent care clinic within 12-24 hours.'
        };
    }

    // 3. Same-day / Primary Care Tier Check
    if (fever || symptoms.length >= 2) {
        return {
            tier: URGENCY_TIERS.SAME_DAY,
            badge: '🟡 Same-Day Evaluation Recommended',
            recommendedAction: 'Schedule a consultation with a General Physician today or tomorrow.'
        };
    }

    // 4. Self-care Tier Default
    return {
        tier: URGENCY_TIERS.SELF_CARE,
        badge: '🟢 Self-Care Appropriate',
        recommendedAction: 'Rest, hydrate, and monitor symptoms at home. Consult a physician if symptoms worsen.'
    };
}
