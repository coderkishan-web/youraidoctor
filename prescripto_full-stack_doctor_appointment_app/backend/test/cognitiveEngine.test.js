/**
 * Automated Regression Test Suite for Phase 5 Cognitive Decision Engine
 * Validates:
 * 1. Intent Classification & Confidence Scoring
 * 2. General Knowledge Non-Medical Answering (BMW M5, React)
 * 3. Topic Interruption & Context Recovery ("Continue")
 * 4. Short One-Word Answer Interpretation ("4", "yes", "mild")
 * 5. Emergency Intercept Priority
 */

import { detectIntent, INTENTS } from '../services/ai/IntentEngine.js';
import { interpretShortAnswer, isRecoveryCommand } from '../services/ai/TopicStackEngine.js';
import { routeMessage, PIPELINES } from '../services/ai/DecisionRouter.js';
import { detectLanguage } from '../services/ai/LanguageDetector.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ PASS: ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

console.log('\n======================================================');
console.log('🧪 RUNNING PHASE 5 COGNITIVE ENGINE REGRESSION SUITE');
console.log('======================================================\n');

// TEST 1: Language Detection
console.log('--- TEST 1: Language & Script Detection ---');
const langEn = detectLanguage('I have a mild fever');
assert(langEn.language === 'English', 'English detected correctly');

const langHinglish = detectLanguage('mujhe sar dard aur bukhar hai');
assert(langHinglish.language === 'Hinglish', 'Hinglish detected correctly');

// TEST 2: Intent Classification & Confidence Scoring
console.log('\n--- TEST 2: Intent Classification & Confidence Scoring ---');
const generalRes = detectIntent('What is the BMW M5 price?');
assert(generalRes.intent === INTENTS.GENERAL_KNOWLEDGE, 'BMW M5 classified as GENERAL_KNOWLEDGE');
assert(generalRes.confidence >= 0.90, `General knowledge confidence is high (${(generalRes.confidence * 100).toFixed(0)}%)`);
assert(generalRes.medicalConfidence < 0.10, 'Medical confidence is very low (< 10%)');
assert(generalRes.isMedical === false, 'isMedical flag is false for off-topic query');

const symptomRes = detectIntent('I have a severe headache and fever since yesterday');
assert(symptomRes.intent === INTENTS.MEDICAL_SYMPTOMS, 'Headache & fever classified as MEDICAL_SYMPTOMS');
assert(symptomRes.confidence >= 0.90, 'Medical symptoms confidence is high');
assert(symptomRes.isMedical === true, 'isMedical flag is true');

const emergencyRes = detectIntent('I have crushing chest pain and difficulty breathing');
assert(emergencyRes.intent === INTENTS.EMERGENCY, 'Chest pain classified as EMERGENCY');
assert(emergencyRes.isEmergency === true, 'isEmergency flag set to true');

// TEST 3: Decision Routing
console.log('\n--- TEST 3: Decision Router Pipeline Selection ---');
const routeGen = routeMessage({ intentResult: generalRes, memory: {} });
assert(routeGen.pipeline === PIPELINES.GENERAL_KNOWLEDGE, 'Off-topic query routed to GENERAL_KNOWLEDGE_PIPELINE');

const routeMed = routeMessage({ intentResult: symptomRes, memory: {} });
assert(routeMed.pipeline === PIPELINES.MEDICAL, 'Symptom query routed to MEDICAL_PIPELINE');

const routeEmg = routeMessage({ intentResult: emergencyRes, memory: {} });
assert(routeEmg.pipeline === PIPELINES.EMERGENCY, 'Emergency query routed to EMERGENCY_PIPELINE');

// TEST 4: Topic Stack Recovery ("Continue")
console.log('\n--- TEST 4: Context & Topic Recovery ---');
assert(isRecoveryCommand('continue') === true, '"continue" recognized as recovery command');
assert(isRecoveryCommand('back to my health') === true, '"back to my health" recognized as recovery command');
assert(isRecoveryCommand('what is react') === false, '"what is react" is not a recovery command');

const routeRecovery = routeMessage({
    intentResult: detectIntent('continue'),
    memory: { currentSymptoms: ['headache'] },
    isRecovery: true
});
assert(routeRecovery.pipeline === PIPELINES.MEDICAL, 'Recovery command "continue" successfully resumes MEDICAL_PIPELINE');

// TEST 5: Short One-Word Reply Parsing
console.log('\n--- TEST 5: Short One-Word Reply Context Parsing ---');
const shortNum = interpretShortAnswer('4', { lastQuestionAsked: 'How many days have you had the fever?' });
assert(shortNum.isShortAnswer === true, 'Recognized "4" as short answer');
assert(shortNum.interpretedData.type === 'duration', 'Parsed "4" as duration');
assert(shortNum.interpretedData.value === '4 days', 'Formatted "4" as "4 days"');

const shortYes = interpretShortAnswer('yes', { lastQuestionAsked: 'Do you also have a fever?' });
assert(shortYes.isShortAnswer === true, 'Recognized "yes" as short answer');
assert(shortYes.interpretedData.type === 'fever', 'Parsed "yes" as fever confirmation');

console.log('\n======================================================');
console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
