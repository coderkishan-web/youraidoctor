import express from 'express';
import { getNearbyFacilities, getRouteGuidance, getEmergencyAutoFacility } from '../controllers/mapController.js';

const mapRouter = express.Router();

mapRouter.get('/nearby', getNearbyFacilities);
mapRouter.post('/nearby', getNearbyFacilities);
mapRouter.post('/route', getRouteGuidance);
mapRouter.post('/emergency-auto', getEmergencyAutoFacility);

export default mapRouter;
