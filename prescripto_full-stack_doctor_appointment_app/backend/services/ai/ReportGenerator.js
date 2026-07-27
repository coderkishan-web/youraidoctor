/**
 * Report Generator for AI Medical Companion
 * Generates clean, structured Health Assessment Summary Reports from Structured Memory.
 */

export function generateHealthReport(memory = {}, user = {}, reasoning = {}) {
    const patientName = user.name || 'Patient';
    const ageCategory = user.healthProfile?.ageCategory || 'Adult';

    const rawSymptoms = memory.currentSymptoms || [];
    const currentSymptoms = Array.isArray(rawSymptoms) ? rawSymptoms : [String(rawSymptoms)];
    const symptomsText = currentSymptoms.length > 0 ? currentSymptoms.join(', ') : 'General Health Inquiry';

    const timeline = memory.symptomTimeline || memory.duration || 'Not specified';
    const severity = memory.severity || 'Mild to Moderate';
    const feverStatus = memory.fever ? 'Yes (Fever reported)' : 'No fever reported';
    const riskTier = reasoning.riskBadge || memory.urgencyTier || '🟢 Low Risk';
    const specialty = reasoning.recommendedSpecialty || 'General Physician';

    const rawCauses = reasoning.possibleCauses || ['Mild viral infection', 'General fatigue'];
    const causes = Array.isArray(rawCauses) ? rawCauses : [String(rawCauses)];

    const rawAllergies = memory.allergies || [];
    const allergiesList = Array.isArray(rawAllergies) ? rawAllergies.join(', ') : String(rawAllergies);

    const reportDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const reportText = `
📋 **PATIENT HEALTH ASSESSMENT REPORT**
--------------------------------------------------
**Date:** ${reportDate}
**Patient Name:** ${patientName} (${ageCategory})
**Risk Level:** ${riskTier}

1. **SYMPTOMS SUMMARY & TIMELINE**
• **Reported Symptoms:** ${symptomsText}
• **Onset / Duration:** ${timeline}
• **Intensity / Severity:** ${severity}
• **Fever Status:** ${feverStatus}
• **Known Allergies:** ${allergiesList || 'None on record'}

2. **CLINICAL DIFFERENTIAL SUSPICIONS**
${causes.map((c, i) => `${i + 1}. ${c}`).join('\n')}

3. **RECOMMENDED NEXT STEPS & SPECIALTY**
• **Recommended Medical Specialty:** ${specialty}
• **Doctor Consultation:** ${reasoning.bookingAction ? 'Recommended within 24-48 hours' : 'Optional / Rest & monitor at home'}

4. **HOME CARE & PRECAUTIONS**
• Stay well-hydrated with clean water, herbal tea, or electrolyte solution.
• Get adequate sleep (7-8 hours) and avoid strenuous physical exertion.
• Monitor symptoms closely. Seek urgent medical care if you experience chest pain or severe breathlessness.

--------------------------------------------------
⚖️ **Disclaimer:** This report is generated from your structured conversation with AI Medical Companion for triage and educational purposes only. It does not constitute a formal diagnosis or medical prescription.
`.trim();

    return {
        reportText,
        patientName,
        date: reportDate,
        riskBadge: riskTier,
        recommendedSpecialty: specialty,
        symptoms: currentSymptoms,
        memory
    };
}
