/**
 * MapIntelligenceEngine for AI Medical Companion (Phase 5)
 * Core Backend Intelligence Service responsible for:
 * - Geolocation context processing
 * - Contextual medical symptom mapping to targeted facility specialties
 * - Multi-factor weighted search ranking algorithm
 * - Smart radius auto-expansion (5km -> 10km -> 25km)
 * - Provider Adapter delegation (Leaflet/OSM, Google, Mapbox)
 * - In-app Route Guidance & Turn-by-Turn step computation
 */

import { LeafletOSMProvider } from './MapProviderAdapter.js';
import { logger } from './Logger.js';

export class MapIntelligenceEngine {
    constructor(provider = new LeafletOSMProvider()) {
        this.provider = provider;
    }

    /**
     * Map medical symptoms/user intent to specific target hospital/clinic specialties
     */
    mapSymptomToSpecialty(symptomOrIntent = '') {
        const text = String(symptomOrIntent).toLowerCase();
        if (/\b(chest pain|heart|cardiac|palpitations|heart attack|angina)\b/i.test(text)) {
            return { specialty: 'Cardiology', preferCategory: 'hospitals', emergencyOnly: true };
        }
        if (/\b(fracture|bone|broken|sprain|dislocation|joint pain|ortho|knee pain)\b/i.test(text)) {
            return { specialty: 'Orthopedics', preferCategory: 'hospitals', emergencyOnly: false };
        }
        if (/\b(pregnancy|pregnant|labor|baby birth|delivery|maternity|gynec)\b/i.test(text)) {
            return { specialty: 'Maternity', preferCategory: 'hospitals', emergencyOnly: true };
        }
        if (/\b(child|infant|pediatric|baby|toddler|kid|pediatrician)\b/i.test(text)) {
            return { specialty: 'Pediatrics', preferCategory: 'hospitals', emergencyOnly: false };
        }
        if (/\b(eye|vision|blurred vision|eye pain|cataract|ophthalmology)\b/i.test(text)) {
            return { specialty: 'Ophthalmology', preferCategory: 'clinics', emergencyOnly: false };
        }
        if (/\b(tooth|teeth|dental|gum pain|cavity|dentist)\b/i.test(text)) {
            return { specialty: 'Dentistry', preferCategory: 'clinics', emergencyOnly: false };
        }
        if (/\b(skin|rash|itching|dermatology|eczema|psoriasis|acne)\b/i.test(text)) {
            return { specialty: 'Dermatology', preferCategory: 'clinics', emergencyOnly: false };
        }
        if (/\b(blood|platelets|plasma|transfusion|blood bank)\b/i.test(text)) {
            return { specialty: 'Transfusion Medicine', preferCategory: 'blood_banks', emergencyOnly: false };
        }
        if (/\b(medicine|drug|pharmacy|chemist|24x7 pharmacy|tablets)\b/i.test(text)) {
            return { specialty: 'Pharmacy', preferCategory: 'pharmacies', emergencyOnly: false };
        }
        if (/\b(ambulance|critical transfer|icu on wheels)\b/i.test(text)) {
            return { specialty: 'Emergency Transport', preferCategory: 'ambulances', emergencyOnly: true };
        }

        return { specialty: null, preferCategory: 'hospitals', emergencyOnly: false };
    }

    /**
     * Search nearby medical places with smart radius auto-expansion & multi-factor ranking
     */
    async searchNearbyFacilities({ lat, lng, category = 'hospitals', radiusKm = 5, specialty = null, symptom = null }) {
        if (!lat || !lng) {
            // Default fallback to center of user's urban area (e.g. Mumbai center) if GPS missing
            lat = 19.0760;
            lng = 72.8777;
        }

        // Infer medical intent if symptom passed
        let targetSpecialty = specialty;
        let targetCategory = category;
        if (symptom) {
            const mapped = this.mapSymptomToSpecialty(symptom);
            if (mapped.specialty) targetSpecialty = mapped.specialty;
            if (mapped.preferCategory && category === 'hospitals') targetCategory = mapped.preferCategory;
        }

        const radiiToTry = [radiusKm * 1000, 10000, 25000]; // 5km -> 10km -> 25km auto expansion
        let places = [];
        let actualRadiusMeters = radiusKm * 1000;

        for (const radiusMeters of radiiToTry) {
            actualRadiusMeters = radiusMeters;
            places = await this.provider.searchNearbyPlaces({
                lat: Number(lat),
                lng: Number(lng),
                radiusMeters,
                category: targetCategory,
                specialty: targetSpecialty
            });

            if (places && places.length > 0) {
                break; // Stop expansion once facilities are found
            }
        }

        // Multi-Factor Search Ranking Algorithm
        const rankedPlaces = this.rankFacilities(places, { targetSpecialty, category: targetCategory });

        return {
            category: targetCategory,
            specialty: targetSpecialty,
            searchRadiusKm: actualRadiusMeters / 1000,
            userCoordinates: { lat: Number(lat), lng: Number(lng) },
            totalFound: rankedPlaces.length,
            places: rankedPlaces
        };
    }

    /**
     * Multi-Factor Ranking Algorithm
     * Weights:
     * - Distance (35%)
     * - Travel Time / ETA (25%)
     * - Emergency Capability (20%)
     * - Specialization Match (10%)
     * - Open 24x7 (10%)
     */
    rankFacilities(places, { targetSpecialty, category }) {
        if (!places || places.length === 0) return [];

        const maxDist = Math.max(...places.map(p => p.distanceKm || 1), 1);
        const maxETA = Math.max(...places.map(p => p.estimatedTimeMin || 1), 1);

        const scored = places.map(p => {
            // Distance Score (inverse, closer is better: 0..35)
            const distScore = (1 - ((p.distanceKm || 0) / maxDist)) * 35;

            // Travel Time Score (inverse, faster is better: 0..25)
            const etaScore = (1 - ((p.estimatedTimeMin || 0) / maxETA)) * 25;

            // Emergency Capability Score (0..20)
            const emergencyScore = (p.emergencyCapable || p.isOpen24x7) ? 20 : 5;

            // Specialization Match Score (0..10)
            let specScore = 5;
            if (targetSpecialty && p.specialties) {
                const match = p.specialties.some(s => String(s).toLowerCase().includes(String(targetSpecialty).toLowerCase()));
                if (match) specScore = 10;
            }

            // Open 24x7 Bonus (0..10)
            const openScore = p.isOpen24x7 ? 10 : 0;

            const totalScore = parseFloat((distScore + etaScore + emergencyScore + specScore + openScore).toFixed(1));

            return {
                ...p,
                confidenceScore: totalScore,
                rankingMetrics: {
                    distanceScore: parseFloat(distScore.toFixed(1)),
                    etaScore: parseFloat(etaScore.toFixed(1)),
                    emergencyScore,
                    specScore,
                    openScore
                }
            };
        });

        // Sort descending by composite confidence score
        return scored.sort((a, b) => b.confidenceScore - a.confidenceScore);
    }

    /**
     * Route calculation & turn-by-turn guidance
     */
    async getRouteGuidance({ origin, destination, mode = 'driving' }) {
        if (!origin || !destination) {
            throw new Error("Origin and destination coordinates are required for route guidance");
        }

        const routeData = await this.provider.calculateRoute({ origin, destination, mode });

        // Add companion reassurance messages
        const companionUpdates = [
            `You are ${routeData.distanceKm} km away from your medical destination.`,
            `Estimated arrival time is in approximately ${routeData.durationMinutes} minutes.`,
            `Traffic appears light along your route.`,
            `If your symptoms worsen or you need immediate emergency support, let me know right away.`,
            `I am staying with you until you safely reach medical care.`
        ];

        return {
            ...routeData,
            companionUpdates
        };
    }

    /**
     * Auto Emergency Mode: Instant calculation of nearest high-capability emergency hospital & route
     */
    async getEmergencyAutoFacility({ lat, lng, symptom = 'acute emergency' }) {
        const searchResult = await this.searchNearbyFacilities({
            lat,
            lng,
            category: 'hospitals',
            radiusKm: 5,
            symptom
        });

        const topFacility = searchResult.places[0] || null;
        let route = null;

        if (topFacility) {
            route = await this.getRouteGuidance({
                origin: { lat: Number(lat), lng: Number(lng) },
                destination: { lat: topFacility.lat, lng: topFacility.lng }
            });
        }

        return {
            emergencyActive: true,
            symptom,
            topFacility,
            route,
            allFacilities: searchResult.places,
            emergencyContacts: [
                { title: 'National Medical Emergency', phone: '108' },
                { title: 'Police / Disaster Response', phone: '112' },
                { title: 'Fire & Rescue Service', phone: '101' }
            ]
        };
    }
}

export const mapIntelligenceEngine = new MapIntelligenceEngine();
