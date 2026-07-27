/**
 * Conversation Director for AI Medical Companion (Phase 3 Refactored)
 * Executes 14-Step Clinical Reasoning Pipeline:
 * Message -> Intent -> Emergency Check -> Normalization -> Entity Extraction
 * -> Context Engine -> Memory Sync -> RAG Retrieval -> Symptom Correlation
 * -> Differential Reasoning -> Urgency Risk & Confidence Assessment
 * -> Explanation Engine -> Gemini Execution -> Response Validation -> Memory & Report Save
 */

import { detectIntent, INTENTS } from './IntentEngine.js';
import { assessEmergency } from './SafetyEngine.js';
import { normalizeSymptomTerms } from './NormalizationEngine.js';
import { extractMedicalEntities } from './EntityExtractionEngine.js';
import { correlateSymptoms } from './ClinicalCorrelationEngine.js';
import { generateDifferentialReasoning } from './DifferentialReasoningEngine.js';
import { assessUrgencyTier } from './UrgencyRiskEngine.js';
import { buildPlainLanguageExplanations } from './ExplanationEngine.js';
import { analyzeMedications } from './MedicationIntelligenceEngine.js';
import { analyzeContext } from './ContextEngine.js';
import { updateMemory } from './MemoryEngine.js';
import { searchRelevantContext } from './DatasetRetrieval.js';
import { planNextQuestion } from './QuestionPlanner.js';
import { validateAIOutput } from './ValidationEngine.js';
import { buildSystemPrompt } from './PromptBuilder.js';
import { generateContent } from './GeminiService.js';
import { loadUserSession, saveUserSession } from './SessionManager.js';

export async function processMessage({ userId, message, sessionId = 'session-default', language = 'English' }) {
    // 1. Load User Session
    const sessionData = await loadUserSession(userId);
    if (!sessionData) {
        throw new Error('User context not found');
    }

    const { user, healthProfile, chatHistory } = sessionData;
    let memory = healthProfile.structuredMemory || {};

    // 2. Intent Detection
    const intentResult = detectIntent(message);

    // 3. Safety Layer Emergency Intercept
    const emergencyAssessment = assessEmergency(message, memory);
    if (emergencyAssessment.isEmergency) {
        memory.emergencyScore = 10;
        healthProfile.structuredMemory = memory;

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({
            id: 'msg-' + Date.now() + '-ai',
            sessionId,
            sender: 'ai',
            message: emergencyAssessment.response.reply,
            riskBadge: emergencyAssessment.response.riskBadge,
            recommendedSpecialty: emergencyAssessment.response.recommendedSpecialty,
            bookingAction: true,
            timestamp: new Date().toISOString()
        });

        await saveUserSession(userId, healthProfile, chatHistory);
        return emergencyAssessment.response;
    }

    // 4. Handle Off-Topic Query
    if (intentResult.intent === INTENTS.OFF_TOPIC || intentResult.intent === INTENTS.GENERAL_KNOWLEDGE) {
        const offTopicPrompt = `
You are a warm companion. User asked: "${message}". Answer naturally in 2-3 sentences.
Then end with: "If you'd like, we can continue discussing your health whenever you're ready."
`.trim();

        let reply = await generateContent(offTopicPrompt, message);
        if (!reply) {
            reply = `That's an interesting question! While I can share insights on that, my main focus is your health and well-being. If you'd like, we can continue discussing your health whenever you're ready! 😊`;
        }

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: reply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);

        return { reply, intent: intentResult.intent, isOffTopic: true };
    }

    // 5. Greeting Intent
    if (intentResult.intent === INTENTS.GREETING) {
        const greetingReply = `Hello ${user.name || 'there'}! 👋 I'm YourAiDoctor, your clinical triage and personal health companion. How are you feeling today? Are there any symptoms or wellness questions on your mind?`;

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: greetingReply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);

        return { reply: greetingReply, intent: INTENTS.GREETING };
    }

    // 5b. Mental Wellness Intent — focused empathetic response
    if (intentResult.intent === INTENTS.MENTAL_WELLNESS) {
        const mentalPrompt = `You are a warm, empathetic mental wellness companion. The user said: "${message}". 
Respond with deep empathy in 3-4 sentences. Acknowledge their feelings, normalize them, and suggest 1 practical mindfulness or breathing technique.
End with a gentle question like: "Would you like to talk more about what's been contributing to how you feel?" 
Do NOT mention any physical symptoms. Be warm and supportive.`;
        let reply = await generateContent(mentalPrompt, message);
        if (!reply) {
            reply = `I hear you, and I want you to know that what you're feeling is completely valid. Anxiety and stress are very common, and it takes courage to recognize them. Try taking 5 slow deep breaths — inhale for 4 counts, hold for 4, exhale for 6. Would you like to talk more about what's been contributing to how you feel?`;
        }
        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: reply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);
        return { reply, intent: INTENTS.MENTAL_WELLNESS };
    }

    // 5c. Medication Question Intent — clinical but safe response
    if (intentResult.intent === INTENTS.MEDICATION_QUESTION) {
        const medPrompt = `You are a clinical pharmacology assistant. The user asked: "${message}".
Answer clearly and safely in 3-5 sentences. Mention standard guidance, common interactions, and always recommend consulting a pharmacist or doctor for personalized advice.
Do NOT answer based on any previous symptom history. Focus only on the medication question asked.`;
        let reply = await generateContent(medPrompt, message);
        if (!reply) {
            reply = `That's a great question about medication. Ibuprofen and paracetamol (acetaminophen) are generally considered safe to take together since they work through different mechanisms — ibuprofen is an NSAID while paracetamol acts centrally. However, always follow recommended doses and consult your pharmacist or doctor for personalized advice, especially if you have kidney, liver, or stomach conditions.`;
        }
        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: reply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);
        return { reply, intent: INTENTS.MEDICATION_QUESTION };
    }

    // 5d. Disease Education Intent — educational response
    if (intentResult.intent === INTENTS.DISEASE_EDUCATION) {
        const eduPrompt = `You are a medical educator. The user asked: "${message}".
Provide a clear, plain-language educational response in 4-5 sentences covering what it is, causes, and when to seek care.
Do not inject any symptom memory. Be informative and approachable.`;
        let reply = await generateContent(eduPrompt, message);
        if (!reply) {
            reply = `That's a great question! I'll provide a clear educational overview about what you asked. For more personalized guidance based on your specific health profile, consulting a healthcare professional is always recommended.`;
        }
        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: reply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);
        return { reply, intent: INTENTS.DISEASE_EDUCATION };
    }

    // 5e. Nutrition & Lifestyle — focused wellness response
    if (intentResult.intent === INTENTS.NUTRITION || intentResult.intent === INTENTS.LIFESTYLE) {
        const wellnessPrompt = `You are a wellness and lifestyle advisor. The user asked: "${message}".
Give practical, evidence-based advice in 3-5 sentences. Be warm and actionable.
Do not inject any symptom history. End with an encouraging note.`;
        let reply = await generateContent(wellnessPrompt, message);
        if (!reply) {
            reply = `Great question! Maintaining a balanced diet and healthy lifestyle can significantly impact your overall wellbeing. I'd recommend starting with small, consistent habits rather than big changes — they're much easier to maintain. Keep up the great work in taking care of your health! 💪`;
        }
        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: reply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);
        return { reply, intent: intentResult.intent };
    }

    // 5f. Appointment Booking
    if (intentResult.intent === INTENTS.APPOINTMENT_BOOKING) {
        const bookingReply = `I can help you book a doctor's appointment! 🩺 You can browse our available specialists using the **"Find Doctors"** feature in the navigation menu, and book a time slot that works for you. Would you like me to suggest a specialist based on your recent health discussion?`;
        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: bookingReply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);
        return { reply: bookingReply, intent: INTENTS.APPOINTMENT_BOOKING, bookingAction: true };
    }

    // 5g. Goodbye
    if (intentResult.intent === INTENTS.GOODBYE) {
        const goodbyeReply = `Take care, ${user.name || 'friend'}! 👋 Remember, your health is your greatest wealth. Feel free to come back anytime you need guidance or have health questions. Stay well! 🌿`;
        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: goodbyeReply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);
        return { reply: goodbyeReply, intent: INTENTS.GOODBYE };
    }


    // 6. Clinical Normalization & Medical Entity Extraction
    const normalizedTerms = normalizeSymptomTerms(message);
    const extractedEntities = extractMedicalEntities(message, {
        symptoms: memory.currentSymptoms || [],
        duration: memory.duration || '',
        severity: memory.severity || '',
        painLocation: memory.painLocation || '',
        vitals: memory.vitals || {},
        medications: memory.medications || []
    });

    // Merge extracted entities into memory
    memory.currentSymptoms = Array.from(new Set([...(memory.currentSymptoms || []), ...normalizedTerms, ...(extractedEntities.symptoms || [])]));
    if (extractedEntities.duration) memory.duration = extractedEntities.duration;
    if (extractedEntities.severity) memory.severity = extractedEntities.severity;
    if (extractedEntities.painLocation) memory.painLocation = extractedEntities.painLocation;

    // 7. Context Engine Analysis
    const contextAnalysis = analyzeContext(message, memory);

    // 8. Update Memory State & Confidence Level
    memory = updateMemory(message, memory, user, intentResult.intent);

    // 9. Dataset Retrieval (RAG)
    const datasetContext = searchRelevantContext(message, memory.currentSymptoms);

    // 10. Clinical Correlation & Differential Reasoning
    const correlatedClusters = correlateSymptoms(memory.currentSymptoms, message);
    const differential = generateDifferentialReasoning(memory.currentSymptoms, memory.duration, memory.severity, correlatedClusters);

    // 11. Urgency Risk Triage & Explanation Engine
    const urgencyAssessment = assessUrgencyTier(memory.currentSymptoms, memory.severity || '', memory.fever, correlatedClusters);
    const explanations = buildPlainLanguageExplanations(memory.currentSymptoms, urgencyAssessment.tier);

    // 12. Medication & Allergy Check
    const medAnalysis = analyzeMedications(extractedEntities.medications, memory.allergies);

    // 13. Question Planner (ONE Question Rule)
    const plannedQuestion = planNextQuestion(memory, user, contextAnalysis);

    // 14. Prompt Builder for Gemini
    const systemPrompt = buildSystemPrompt({
        user,
        memory,
        intent: intentResult,
        datasetContext: `${datasetContext}\n\nClinical Urgency Tier: ${urgencyAssessment.tier}\nPrimary Consideration: ${differential.primaryPossibility.name}\n${explanations}`,
        plannedQuestion,
        contextAnalysis
    });

    // 15. Gemini Call & Response Validation
    let rawReply = await generateContent(systemPrompt, message);
    if (!rawReply) {
        rawReply = `I am paying close attention to your symptoms (${memory.currentSymptoms.join(', ') || 'health inquiry'}). Based on your symptoms, we classify this as **${urgencyAssessment.badge}**.\n\n${plannedQuestion}`;
    }

    if (medAnalysis.warnings.length > 0) {
        rawReply = `${medAnalysis.warnings.join('\n')}\n\n${rawReply}`;
    }

    const finalReply = validateAIOutput(rawReply, plannedQuestion, memory.lastQuestionAsked);

    // Update memory for next turn
    memory.lastQuestionAsked = plannedQuestion;
    memory.clinicalDifferential = differential;
    memory.urgencyTier = urgencyAssessment.tier;
    healthProfile.structuredMemory = memory;

    // Save Chat History
    chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
    chatHistory.push({
        id: 'msg-' + Date.now() + '-ai',
        sessionId,
        sender: 'ai',
        message: finalReply,
        riskBadge: urgencyAssessment.badge,
        recommendedSpecialty: urgencyAssessment.tier.includes('Emergency') ? 'Emergency Medicine' : 'General Physician',
        bookingAction: !urgencyAssessment.tier.includes('Self-care'),
        timestamp: new Date().toISOString()
    });

    await saveUserSession(userId, healthProfile, chatHistory);

    return {
        reply: finalReply,
        intent: intentResult.intent,
        riskBadge: urgencyAssessment.badge,
        urgencyTier: urgencyAssessment.tier,
        differential,
        memory
    };
}
