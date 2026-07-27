/**
 * Dataset Retrieval Engine for AI Medical Companion
 * Performs local dataset matching from full_medical_dataset.jsonl and healthKnowledgeBase.json
 * to provide clinical context to Gemini and prevent hallucination.
 */

import fs from 'fs';
import path from 'path';

const kbPath = path.join(process.cwd(), 'data', 'healthKnowledgeBase.json');
const datasetPath = path.join(process.cwd(), 'data', 'medical_dataset.json');
const fullDatasetPath = path.join(process.cwd(), 'data', 'full_medical_dataset.jsonl');

let knowledgeBaseCache = null;
let datasetSampleCache = null;

function loadKnowledgeBase() {
    if (knowledgeBaseCache) return knowledgeBaseCache;
    try {
        if (fs.existsSync(kbPath)) {
            knowledgeBaseCache = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
            return knowledgeBaseCache;
        }
    } catch (e) {
        console.error('Error loading health knowledge base:', e);
    }
    return { firstAidGuides: [], symptomsMatrix: [], whoHealthGuidelines: [] };
}

function loadMedicalDatasetSample() {
    if (datasetSampleCache) return datasetSampleCache;
    try {
        if (fs.existsSync(fullDatasetPath)) {
            const fileContent = fs.readFileSync(fullDatasetPath, 'utf8');
            const lines = fileContent.split('\n').filter(line => line.trim());
            // Take up to 1000 items for fast search in memory
            datasetSampleCache = lines.slice(0, 1000).map(line => {
                try { return JSON.parse(line); } catch (e) { return null; }
            }).filter(Boolean);
            return datasetSampleCache;
        } else if (fs.existsSync(datasetPath)) {
            const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
            datasetSampleCache = data.qaPairs || [];
            return datasetSampleCache;
        }
    } catch (e) {
        console.error('Error loading medical dataset sample:', e);
    }
    return [];
}

/**
 * Searches local dataset for relevant medical dialogues and clinical facts.
 * Returns concise context string to attach to Gemini prompt.
 */
export function searchRelevantContext(userMessage = '', symptoms = []) {
    const kb = loadKnowledgeBase();
    const dataset = loadMedicalDatasetSample();

    const text = (userMessage + ' ' + symptoms.join(' ')).toLowerCase();
    const matchedDocs = [];

    // 1. Search Symptoms Matrix in Knowledge Base
    if (kb.symptomMatrix || kb.symptom_matrix) {
        const matrix = kb.symptomMatrix || kb.symptom_matrix || [];
        matrix.forEach(item => {
            if (item.symptom && text.includes(item.symptom.toLowerCase())) {
                matchedDocs.push(`[Clinical Guideline] Symptom: ${item.symptom} | Possible Causes: ${(item.possibleCauses || []).join(', ')} | Care: ${item.homeCare || ''}`);
            }
        });
    }

    // 2. Search Medical QA Pairs in dataset
    let count = 0;
    for (const entry of dataset) {
        const inputStr = (entry.input || entry.question || entry.instruction || '').toLowerCase();
        if (symptoms.some(s => inputStr.includes(s.toLowerCase())) || (inputStr.length > 5 && text.includes(inputStr.substring(0, 15)))) {
            const outputStr = entry.output || entry.answer || entry.response || '';
            if (outputStr) {
                matchedDocs.push(`[Reference Medical Case] Query: "${entry.input || entry.question}" -> Clinical Guidance: "${outputStr.substring(0, 300)}..."`);
                count++;
                if (count >= 2) break; // Limit to 2 snippets for token efficiency
            }
        }
    }

    if (matchedDocs.length === 0) {
        return "No specific local dataset match. Use general medical knowledge.";
    }

    return matchedDocs.join('\n');
}
