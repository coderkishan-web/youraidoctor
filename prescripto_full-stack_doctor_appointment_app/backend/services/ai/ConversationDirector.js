/**
 * Conversation Director for AI Medical Companion (Phase 5 Cognitive Pipeline)
 * Executes 15-Step Cognitive Pipeline:
 * Incoming Message -> Language Detection -> Intent & Confidence Scoring
 * -> Emergency Safety Intercept -> Context & Topic Recovery Check -> Short Answer Interpretation
 * -> Decision Router -> Flow Manager State Transition -> Response Planner
 * -> RAG & Clinical Reasoning / General Knowledge Execution -> Gemini Prompt Assembly
 * -> Response Validation -> Internal Decision Logging -> Memory & Session Sync -> Frontend Output
 */

import { detectLanguage } from './LanguageDetector.js';
import { detectIntent, CONFIDENCE_THRESHOLD, INTENTS } from './IntentEngine.js';
import { isRecoveryCommand, pushTopic, recoverTopic, interpretShortAnswer } from './TopicStackEngine.js';
import { routeMessage, PIPELINES } from './DecisionRouter.js';
import { determineTargetState, transitionState, STATES } from './FlowManager.js';
import { planResponseStrategy, getNextOpeningPhrase } from './ResponsePlanner.js';
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
import { logger } from './Logger.js';

export async function processMessage({ userId, message, sessionId = 'session-default', language = 'English' }) {
    // 1. Load User Session
    const sessionData = await loadUserSession(userId);
    if (!sessionData) {
        throw new Error('User context not found');
    }

    const { user, healthProfile, chatHistory } = sessionData;
    let memory = healthProfile.structuredMemory || {};

    // 2. Language Detection
    const detectedLang = detectLanguage(message);
    const activeLanguage = language || detectedLang.language;

    // 3. Intent Detection & Confidence Scoring
    const intentResult = detectIntent(message);

    // 4. Safety Emergency Intercept (Priority 1)
    const emergencyAssessment = assessEmergency(message, memory);
    if (emergencyAssessment.isEmergency || intentResult.isEmergency) {
        memory.emergencyScore = 10;
        memory.conversationStage = STATES.EMERGENCY_INTERCEPT;
        healthProfile.structuredMemory = memory;

        const emergencyReply = emergencyAssessment.response ? emergencyAssessment.response.reply : `🚨 **EMERGENCY WARNING**: Based on your symptoms, please seek immediate emergency medical care. Call **108** or **112** right now or visit the nearest ER.`;

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({
            id: 'msg-' + Date.now() + '-ai',
            sessionId,
            sender: 'ai',
            message: emergencyReply,
            riskBadge: '🚨 CRITICAL EMERGENCY',
            recommendedSpecialty: 'Emergency Medicine',
            bookingAction: true,
            timestamp: new Date().toISOString()
        });

        await saveUserSession(userId, healthProfile, chatHistory);
        return {
            reply: emergencyReply,
            intent: INTENTS.EMERGENCY,
            riskBadge: '🚨 CRITICAL EMERGENCY',
            recommendedSpecialty: 'Emergency Medicine',
            bookingAction: true
        };
    }

    // 5. Context Recovery Check & Short-Answer Interpretation
    const isRecovery = isRecoveryCommand(message);
    if (isRecovery) {
        memory = recoverTopic(memory);
    }

    const shortAnswerResult = interpretShortAnswer(message, memory);
    if (shortAnswerResult.isShortAnswer && shortAnswerResult.interpretedData) {
        const { type, value } = shortAnswerResult.interpretedData;
        if (type === 'duration') memory.duration = value;
        if (type === 'severity') memory.severity = value;
        if (type === 'painLocation') memory.painLocation = value;
        if (type === 'fever') memory.fever = value;
        logger.info(`[TopicStackEngine] Interpreted short answer: ${JSON.stringify(shortAnswerResult.interpretedData)}`);
    }

    // 6. Decision Router
    const routeInfo = routeMessage({ intentResult, memory, isRecovery });

    // 7. Flow Manager State Transition
    const targetState = determineTargetState(intentResult, memory);
    const transitionInfo = transitionState(memory.conversationStage || STATES.GREETING, targetState, routeInfo.reason);
    memory.conversationStage = targetState;

    // 8. Response Planner
    const responsePlan = planResponseStrategy({ pipelineRoute: routeInfo, memory, intentResult });

    // Internal Decision Logging
    logger.info(`[CognitivePipeline] User: "${message}" | Intent: ${intentResult.intent} (${(intentResult.confidence * 100).toFixed(0)}%) | Pipeline: ${routeInfo.pipeline} | Strategy: ${responsePlan.strategy}`);

    // ══════════════════════════════════════════════════════════════════════════
    // PIPELINE EXECUTION BRANCHES
    // ══════════════════════════════════════════════════════════════════════════

    // BRANCH A: General Knowledge / Off-Topic Question Handler
    if (routeInfo.pipeline === PIPELINES.GENERAL_KNOWLEDGE || routeInfo.pipeline === PIPELINES.OFF_TOPIC) {
        memory = pushTopic(memory, 'GENERAL_KNOWLEDGE', true);

        const hasPendingAssessment = Boolean(memory.currentSymptoms && memory.currentSymptoms.length > 0);

        const offTopicPrompt = `
You are a warm, intelligent companion. The user asked a general/off-topic question: "${message}".
Answer their question directly, clearly, and concisely in 2-3 sentences.
${hasPendingAssessment ? 'End your answer with: "If you\'d like, we can continue discussing your health whenever you\'re ready."' : ''}
`.trim();

        let reply = await generateContent(offTopicPrompt, message);
        if (!reply) {
            reply = `${responsePlan.opening} That's a great question! While I can share insights on that topic, I want to make sure you get the best information. ${hasPendingAssessment ? "If you'd like, we can continue discussing your health whenever you're ready! 😊" : ''}`;
        }

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: reply, timestamp: new Date().toISOString() });
        
        healthProfile.structuredMemory = memory;
        await saveUserSession(userId, healthProfile, chatHistory);

        return { reply, intent: intentResult.intent, isOffTopic: true };
    }

    // BRANCH B: Greeting Handler
    if (routeInfo.pipeline === PIPELINES.GREETING) {
        const greetingOpening = getNextOpeningPhrase();
        const greetingReply = `${greetingOpening} Hello ${user.name || 'friend'}! 👋 I'm YourAiDoctor, your personal health companion. How are you feeling today? Are there any symptoms or health questions on your mind?`;

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: greetingReply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);

        return { reply: greetingReply, intent: INTENTS.GREETING };
    }

    // BRANCH C: Goodbye Handler
    if (routeInfo.pipeline === PIPELINES.GOODBYE) {
        const goodbyeReply = `Take care, ${user.name || 'friend'}! 👋 Remember, your health is your greatest wealth. Feel free to come back anytime you need guidance or have health questions. Stay well! 🌿`;

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: goodbyeReply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);

        return { reply: goodbyeReply, intent: INTENTS.GOODBYE };
    }

    // BRANCH D: Appointment & Hospital Lookup Handler
    if (routeInfo.pipeline === PIPELINES.APPOINTMENT) {
        const bookingReply = `I can certainly help you with that! 🩺 You can browse top specialists or locate nearby emergency clinics using the **Find Doctors** or **Hospital Finder** features in the navigation bar. Would you like me to recommend a specialist based on your symptoms?`;

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: bookingReply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);

        return { reply: bookingReply, intent: intentResult.intent, bookingAction: true };
    }

    // BRANCH E: Medication Question Handler
    if (routeInfo.pipeline === PIPELINES.MEDICATION) {
        const medPrompt = `You are a clinical pharmacology assistant. The user asked: "${message}".
Answer clearly and safely in 3-4 sentences. Mention standard guidance, common interactions, and recommend consulting a pharmacist or doctor for personalized advice.`;

        let reply = await generateContent(medPrompt, message);
        if (!reply) {
            reply = `That's an important medication question. Always take medications as directed by your physician or pharmacist, and check for potential interactions with your current prescriptions.`;
        }

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: reply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);

        return { reply, intent: INTENTS.MEDICATION_QUESTION };
    }

    // BRANCH F: Mental Health / Nutrition / Lifestyle / Disease Education Handlers
    if (
        routeInfo.pipeline === PIPELINES.MENTAL_HEALTH ||
        routeInfo.pipeline === PIPELINES.NUTRITION_LIFESTYLE ||
        routeInfo.pipeline === PIPELINES.DISEASE_EDUCATION
    ) {
        const domainPrompt = `You are a warm health & wellness companion. The user asked: "${message}".
Provide evidence-based, warm, and actionable advice in 3-4 sentences. Be supportive and encouraging.`;

        let reply = await generateContent(domainPrompt, message);
        if (!reply) {
            reply = `${responsePlan.opening} Taking care of your overall wellbeing is so important. I'm here to support you with practical health guidance whenever you need it!`;
        }

        chatHistory.push({ id: 'msg-' + Date.now() + '-user', sessionId, sender: 'user', message, timestamp: new Date().toISOString() });
        chatHistory.push({ id: 'msg-' + Date.now() + '-ai', sessionId, sender: 'ai', message: reply, timestamp: new Date().toISOString() });
        await saveUserSession(userId, healthProfile, chatHistory);

        return { reply, intent: intentResult.intent };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // BRANCH G: FULL CLINICAL TRIAGE PIPELINE (Medical Symptoms & Medical State)
    // ══════════════════════════════════════════════════════════════════════════
    memory = pushTopic(memory, 'MEDICAL_SYMPTOMS', false);

    // 1. Clinical Normalization & Medical Entity Extraction
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

    // 2. Context Engine Analysis
    const contextAnalysis = analyzeContext(message, memory);

    // 3. Memory Update
    memory = updateMemory(message, memory, user, intentResult.intent);

    // 4. RAG Retrieval
    const datasetContext = searchRelevantContext(message, memory.currentSymptoms);

    // 5. Symptom Correlation & Differential Reasoning
    const correlatedClusters = correlateSymptoms(memory.currentSymptoms, message);
    const differential = generateDifferentialReasoning(memory.currentSymptoms, memory.duration, memory.severity, correlatedClusters);

    // 6. Urgency Risk Triage & Explanations
    const urgencyAssessment = assessUrgencyTier(memory.currentSymptoms, memory.severity || '', memory.fever, correlatedClusters);
    const explanations = buildPlainLanguageExplanations(memory.currentSymptoms, urgencyAssessment.tier);

    // 7. Medication Check
    const medAnalysis = analyzeMedications(extractedEntities.medications, memory.allergies);

    // 8. Question Planner
    const plannedQuestion = planNextQuestion(memory, user, contextAnalysis);

    // 9. Prompt Assembly & Gemini Execution
    const systemPrompt = buildSystemPrompt({
        user,
        memory,
        intent: intentResult,
        datasetContext: `${datasetContext}\n\nClinical Urgency Tier: ${urgencyAssessment.tier}\nPrimary Consideration: ${differential.primaryPossibility.name}\n${explanations}`,
        plannedQuestion,
        contextAnalysis,
        responsePlan,
        language: activeLanguage
    });

    let rawReply = await generateContent(systemPrompt, message);
    if (!rawReply) {
        rawReply = `${responsePlan.opening} I am paying close attention to your symptoms (${memory.currentSymptoms.join(', ') || 'health inquiry'}). Based on what you've described, we classify this as **${urgencyAssessment.badge}**.\n\n${plannedQuestion}`;
    }

    if (medAnalysis.warnings.length > 0) {
        rawReply = `${medAnalysis.warnings.join('\n')}\n\n${rawReply}`;
    }

    const finalReply = validateAIOutput(rawReply, plannedQuestion, memory.lastQuestionAsked);

    // Update Memory State
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
