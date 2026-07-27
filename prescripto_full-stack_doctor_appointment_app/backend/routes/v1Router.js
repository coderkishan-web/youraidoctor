/**
 * API v1 Router for YourAiDoctor (Phase 4 API Versioning)
 * Provides enterprise health check, observability metrics, user feedback, and chat endpoints.
 */

import express from 'express';
import { handleChat, handleOnboard, getChatHistory, handleGenerateReport } from '../controllers/aiController.js';
import { recordFeedback, getFeedbackSummary } from '../services/ai/FeedbackEngine.js';
import { observability } from '../services/ai/Observability.js';
import authUser from '../middleware/authUser.js';

const v1Router = express.Router();

// 1. Health Status Endpoint
v1Router.get('/health', (req, res) => {
    const metrics = observability.getMetricsSnapshot();
    res.json({
        success: true,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        health: metrics
    });
});

// 2. Metrics Telemetry Endpoint
v1Router.get('/metrics', (req, res) => {
    res.json({
        success: true,
        metrics: observability.getMetricsSnapshot()
    });
});

// 3. User Feedback Endpoint
v1Router.post('/feedback', authUser, (req, res) => {
    try {
        const { messageId, rating, category, comments } = req.body;
        const entry = recordFeedback({ messageId, rating, category, comments });
        res.json({ success: true, feedback: entry });
    } catch (e) {
        res.json({ success: false, message: e.message });
    }
});

v1Router.get('/feedback-summary', (req, res) => {
    res.json({ success: true, summary: getFeedbackSummary() });
});

// 4. Backward Compatible Chat & Diagnostic Endpoints under v1
v1Router.post('/chat', authUser, handleChat);
v1Router.post('/onboard', authUser, handleOnboard);
v1Router.post('/chat-history', authUser, getChatHistory);
v1Router.post('/generate-report', authUser, handleGenerateReport);

export default v1Router;
