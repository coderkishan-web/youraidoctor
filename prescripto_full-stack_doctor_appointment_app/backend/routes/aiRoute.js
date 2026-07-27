import express from 'express';
import { handleOnboard, handleChat, getChatHistory, getWhoData, getEmergencyShare, handleGenerateReport } from '../controllers/aiController.js';
import { scanMedicine } from '../controllers/scannerController.js';
import { logVitals, getVitalsHistory } from '../controllers/vitalsController.js';
import authUser from '../middleware/authUser.js';

const aiRouter = express.Router();

aiRouter.post('/onboard', authUser, handleOnboard);
aiRouter.post('/chat', authUser, handleChat);
aiRouter.post('/chat-history', authUser, getChatHistory);
aiRouter.post('/generate-report', authUser, handleGenerateReport);
aiRouter.get('/who-data', getWhoData);
aiRouter.post('/emergency-share', authUser, getEmergencyShare);

// Scan & Vitals routes
aiRouter.post('/scan-medicine', authUser, scanMedicine);
aiRouter.post('/log-vitals', authUser, logVitals);
aiRouter.post('/get-vitals', authUser, getVitalsHistory);

export default aiRouter;
