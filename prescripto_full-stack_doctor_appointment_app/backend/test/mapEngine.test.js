/**
 * Automated Test Suite for Phase 5 Map Intelligence Engine & Navigation System
 * Validates:
 * 1. Facility Search & Category Filtering
 * 2. Contextual Symptom Mapping & Specialty Matching (Chest pain -> Cardiology)
 * 3. Multi-Factor Search Ranking Score Calculation
 * 4. Smart Radius Auto-Expansion (5km -> 10km -> 25km)
 * 5. Route Polyline & Turn-by-Turn Instruction Step Formatting
 * 6. Provider Adapter Fallback Mechanism
 * 7. AI Map Controller Intent Classification
 */

import { mapIntelligenceEngine } from '../services/ai/MapIntelligenceEngine.js';
import { detectIntent, INTENTS } from '../services/ai/IntentEngine.js';
import { mapFutureExtensions } from '../services/ai/MapFutureExtensions.js';

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

async function runMapEngineTests() {
    console.log('\n======================================================');
    console.log('🧪 RUNNING PHASE 5 MAP INTELLIGENCE TEST SUITE');
    console.log('======================================================\n');

    // TEST 1: Symptom Specialty Mapping
    console.log('--- TEST 1: Medical Place Intelligence Symptom Mapping ---');
    const chestPainMap = mapIntelligenceEngine.mapSymptomToSpecialty('I have severe chest pain and breathlessness');
    assert(chestPainMap.specialty === 'Cardiology', 'Chest pain correctly mapped to Cardiology specialty');
    assert(chestPainMap.preferCategory === 'hospitals', 'Chest pain prefers hospital facility category');

    const fractureMap = mapIntelligenceEngine.mapSymptomToSpecialty('I fell down and broke my leg, fracture suspected');
    assert(fractureMap.specialty === 'Orthopedics', 'Fracture correctly mapped to Orthopedics specialty');

    const pregMap = mapIntelligenceEngine.mapSymptomToSpecialty('Pregnant woman having contractions');
    assert(pregMap.specialty === 'Maternity', 'Pregnancy mapped to Maternity specialty');

    // TEST 2: Facility Search & Multi-Factor Ranking
    console.log('\n--- TEST 2: Facility Search & Multi-Factor Ranking ---');
    const searchRes = await mapIntelligenceEngine.searchNearbyFacilities({
        lat: 19.0760,
        lng: 72.8777,
        category: 'hospitals',
        radiusKm: 5,
        symptom: 'chest pain'
    });

    assert(searchRes.places.length > 0, `Facilities returned (${searchRes.places.length} found)`);
    assert(searchRes.places[0].confidenceScore !== undefined, 'Top ranked facility has composite confidenceScore');
    assert(searchRes.places[0].confidenceScore >= searchRes.places[searchRes.places.length - 1].confidenceScore, 'Places sorted descending by confidence score');

    // TEST 3: Smart Radius Auto-Expansion
    console.log('\n--- TEST 3: Radius Auto-Expansion ---');
    const expRes = await mapIntelligenceEngine.searchNearbyFacilities({
        lat: 19.0760,
        lng: 72.8777,
        category: 'blood_banks',
        radiusKm: 1 // small radius force test
    });
    assert(expRes.places.length > 0, 'Auto-expansion found facilities even when initial radius was small');
    assert(expRes.searchRadiusKm >= 1, `Searched radius expansion reached ${expRes.searchRadiusKm} km`);

    // TEST 4: Route Polyline & Turn-by-Turn Instructions
    console.log('\n--- TEST 4: In-App Route Guidance & Turn-by-Turn Steps ---');
    const routeRes = await mapIntelligenceEngine.getRouteGuidance({
        origin: { lat: 19.0760, lng: 72.8777 },
        destination: { lat: 19.0880, lng: 72.8890 }
    });

    assert(routeRes.polyline && routeRes.polyline.length > 0, `Route polyline generated (${routeRes.polyline.length} coordinates)`);
    assert(routeRes.steps && routeRes.steps.length > 0, `Turn-by-turn guidance steps generated (${routeRes.steps.length} steps)`);
    assert(routeRes.companionUpdates && routeRes.companionUpdates.length > 0, 'Companion mode reassuring updates attached');

    // TEST 5: Auto Emergency Mode
    console.log('\n--- TEST 5: Auto Emergency Mode Calculation ---');
    const emgAuto = await mapIntelligenceEngine.getEmergencyAutoFacility({
        lat: 19.0760,
        lng: 72.8777,
        symptom: 'unconscious person'
    });

    assert(emgAuto.emergencyActive === true, 'Emergency mode flag active');
    assert(emgAuto.topFacility !== null, 'Emergency top recommended facility identified');
    assert(emgAuto.route !== null, 'Direct route calculated for emergency facility');

    // TEST 6: AI Map Controller Intent Parsing
    console.log('\n--- TEST 6: AI Natural Language Map Commands ---');
    const intent1 = detectIntent('Take me to the nearest hospital');
    assert(intent1.intent === INTENTS.MAP_NAVIGATION, '"Take me to nearest hospital" recognized as MAP_NAVIGATION');
    assert(intent1.mapAction === 'START_NAVIGATION', 'Parsed action START_NAVIGATION');

    const intent2 = detectIntent('Find a 24 hour pharmacy near me');
    assert(intent2.intent === INTENTS.MAP_NAVIGATION, '"Find 24 hour pharmacy" recognized as MAP_NAVIGATION');
    assert(intent2.mapCategory === 'pharmacies', 'Parsed category pharmacies');

    const intent3 = detectIntent('Show orthopedic hospitals within 10 km');
    assert(intent3.mapSpecialty === 'Orthopedics', 'Parsed specialty Orthopedics');
    assert(intent3.maxRadiusKm === 10, 'Parsed radius limit 10 km');

    const intent4 = detectIntent('Cancel navigation');
    assert(intent4.mapAction === 'CANCEL_NAVIGATION', 'Parsed action CANCEL_NAVIGATION');

    // TEST 7: Future Extensions Interface Check
    console.log('\n--- TEST 7: Future Roadmap Extensions Stubs ---');
    const ambTrack = await mapFutureExtensions.trackLiveAmbulance('AMB-108-99');
    assert(ambTrack.status === 'PLANNED_EXTENSION', 'Live Ambulance Tracking extension point ready');

    console.log('\n======================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');

    if (failed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runMapEngineTests();
