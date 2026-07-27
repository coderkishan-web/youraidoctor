import userModel from '../models/userModel.js';
import { processOnboardingStep, fetchWhoData } from '../services/aiHealthEngine.js';
import { processMessage } from '../services/ai/ConversationDirector.js';
import { generateHealthReport } from '../services/ai/ReportGenerator.js';
import { evaluateClinicalEvidence } from '../services/ai/MedicalReasoning.js';
import { createInitialMemory } from '../services/ai/MemoryEngine.js';

// Controller: Process Onboarding Intake Step
export const handleOnboard = async (req, res) => {
    try {
        const { userId, stepIndex = 0, userResponse = '', accumulatedData = {} } = req.body;

        if (!userId) {
            return res.json({ success: false, message: "User ID is required for secure authentication" });
        }

        const result = await processOnboardingStep(Number(stepIndex), userResponse, accumulatedData);

        if (result.isFinished && result.profileSummary) {
            const user = await userModel.findById(userId);
            await userModel.findByIdAndUpdate(userId, {
                hasCompletedOnboarding: true,
                healthProfile: {
                    ...result.profileSummary,
                    activeSession: { turn: 0, status: 'none', responses: [] },
                    structuredMemory: createInitialMemory()
                },
                emergencyCard: {
                    bloodType: 'O+',
                    allergies: result.profileSummary.medicationsAllergies || 'None',
                    chronicConditions: result.profileSummary.healthHistory || 'None',
                    emergencyContact: user?.phone || 'Emergency Services (108/112)',
                    shareToken: 'EMG-' + Math.random().toString(36).substring(2, 9).toUpperCase()
                }
            });
        }

        res.json({ success: true, ...result });
    } catch (error) {
        console.error("Onboard API Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Controller: AI Personal Companion Chat (Conversation Director)
export const handleChat = async (req, res) => {
    try {
        const { userId, message, language, sessionId } = req.body;
        if (!userId) {
            return res.json({ success: false, message: "User ID is required for secure data access" });
        }
        if (!message) {
            return res.json({ success: false, message: "Message is required" });
        }

        // Delegate execution to Conversation Director
        const aiResponse = await processMessage({
            userId,
            message,
            sessionId: sessionId || 'session-default',
            language
        });

        // Retrieve fresh chat history to maintain exact contract
        const updatedUser = await userModel.findById(userId).select('aiChatHistory');

        res.json({
            success: true,
            response: aiResponse,
            chatHistory: updatedUser?.aiChatHistory || []
        });
    } catch (error) {
        console.error("AI Chat API Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Controller: Generate Structured Medical Report
export const handleGenerateReport = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.json({ success: false, message: "User ID is required" });
        }

        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.json({ success: false, message: "User account not found" });
        }

        const memory = user.healthProfile?.structuredMemory || createInitialMemory();
        const reasoning = evaluateClinicalEvidence(memory, '');
        const report = generateHealthReport(memory, user, reasoning);

        res.json({
            success: true,
            report
        });
    } catch (error) {
        console.error("Generate Report API Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Controller: Get Isolated User AI Chat History
export const getChatHistory = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.json({ success: false, message: "User ID is required" });
        }

        const user = await userModel.findById(userId).select('-password');
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({
            success: true,
            chatHistory: user.aiChatHistory || [],
            learnedInsights: user.healthProfile?.learnedInsights || [],
            structuredMemory: user.healthProfile?.structuredMemory || null
        });
    } catch (error) {
        console.error("Get Chat History Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Controller: Fetch WHO Public Health Data
export const getWhoData = async (req, res) => {
    try {
        const data = await fetchWhoData();
        res.json({ success: true, data });
    } catch (error) {
        console.error("WHO Data API Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Controller: Generate/Get Emergency Health Share Card
export const getEmergencyShare = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId).select('-password');

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const emergencyCard = user.emergencyCard || {
            bloodType: 'O+',
            allergies: user.healthProfile?.medicationsAllergies || 'None',
            chronicConditions: user.healthProfile?.healthHistory || 'None',
            emergencyContact: user.phone || 'Emergency Services (108/112)',
            shareToken: 'EMG-' + user._id
        };

        res.json({
            success: true,
            emergencyCard,
            patientName: user.name,
            patientPhone: user.phone,
            patientEmail: user.email,
            shareUrl: `${req.headers.origin || 'http://localhost:5175'}/emergency-card/${emergencyCard.shareToken || user._id}`
        });
    } catch (error) {
        console.error("Emergency Share API Error:", error);
        res.json({ success: false, message: error.message });
    }
};
