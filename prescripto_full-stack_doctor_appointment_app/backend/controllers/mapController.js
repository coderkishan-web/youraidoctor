import { mapIntelligenceEngine } from '../services/ai/MapIntelligenceEngine.js';

/**
 * Controller: Search Nearby Medical Facilities
 */
export const getNearbyFacilities = async (req, res) => {
    try {
        const { lat, lng, category = 'hospitals', radiusKm = 5, specialty, symptom } = req.query.lat ? req.query : req.body;

        const result = await mapIntelligenceEngine.searchNearbyFacilities({
            lat: parseFloat(lat || 19.0760),
            lng: parseFloat(lng || 72.8777),
            category,
            radiusKm: parseFloat(radiusKm || 5),
            specialty,
            symptom
        });

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error("Map Controller Nearby Error:", error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Controller: Get Route Guidance & Turn-by-Turn Steps
 */
export const getRouteGuidance = async (req, res) => {
    try {
        const { origin, destination, mode = 'driving' } = req.body;

        if (!origin || !destination) {
            return res.json({ success: false, message: "Origin and destination coordinates are required" });
        }

        const routeData = await mapIntelligenceEngine.getRouteGuidance({ origin, destination, mode });

        res.json({
            success: true,
            route: routeData
        });
    } catch (error) {
        console.error("Map Controller Route Error:", error);
        res.json({ success: false, message: error.message });
    }
};

/**
 * Controller: Get Emergency Auto Facility & Direct Route
 */
export const getEmergencyAutoFacility = async (req, res) => {
    try {
        const { lat, lng, symptom = 'acute emergency' } = req.body;

        const emergencyData = await mapIntelligenceEngine.getEmergencyAutoFacility({
            lat: parseFloat(lat || 19.0760),
            lng: parseFloat(lng || 72.8777),
            symptom
        });

        res.json({
            success: true,
            ...emergencyData
        });
    } catch (error) {
        console.error("Map Controller Emergency Error:", error);
        res.json({ success: false, message: error.message });
    }
};
