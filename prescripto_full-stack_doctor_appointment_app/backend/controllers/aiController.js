import userModel from '../models/userModel.js';
import { processOnboardingStep, generateAIHealthResponse, fetchWhoData } from '../services/aiHealthEngine.js';

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
                healthProfile: { ...result.profileSummary, activeSession: { turn: 0, status: 'none', responses: [] } },
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

// Controller: AI Personal Family Doctor Companion Chat
export const handleChat = async (req, res) => {
    try {
        const { userId, message, language, sessionId } = req.body;
        if (!userId) {
            return res.json({ success: false, message: "User ID is required for secure data access" });
        }
        if (!message) {
            return res.json({ success: false, message: "Message is required" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User account not found" });
        }

        const healthProfile = user.healthProfile || {};
        if (language) {
            healthProfile.preferredLanguage = language;
        }

        // Generate Multi-Turn Personalized Response from AI Health Engine
        const aiResponse = await generateAIHealthResponse(message, user);

        // Update Active Diagnostic Intake Session state
        if (aiResponse.session) {
            healthProfile.activeSession = aiResponse.session;
        }

        // Update Learned Personal Insights if new facts detected
        if (aiResponse.newInsights && aiResponse.newInsights.length > 0) {
            const existingInsights = healthProfile.learnedInsights || [];
            const updatedInsights = Array.from(new Set([...existingInsights, ...aiResponse.newInsights]));
            healthProfile.learnedInsights = updatedInsights;
        }

        // Append to User's Isolated Chat History with sessionId
        const activeSessId = sessionId || 'session-default';
        const chatHistory = user.aiChatHistory || [];
        chatHistory.push({
            id: 'msg-' + Date.now() + '-user',
            sessionId: activeSessId,
            sender: 'user',
            message: message,
            timestamp: new Date().toISOString()
        });
        chatHistory.push({
            id: 'msg-' + Date.now() + '-ai',
            sessionId: activeSessId,
            sender: 'ai',
            message: aiResponse.reply,
            riskBadge: aiResponse.riskBadge || null,
            recommendedSpecialty: aiResponse.recommendedSpecialty || null,
            bookingAction: Boolean(aiResponse.bookingAction),
            timestamp: new Date().toISOString()
        });

        // Save updated health profile and isolated chat history
        await userModel.findByIdAndUpdate(userId, {
            healthProfile,
            aiChatHistory: chatHistory
        });

        res.json({
            success: true,
            response: aiResponse,
            chatHistory
        });
    } catch (error) {
        console.error("AI Chat API Error:", error);
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
            activeSession: user.healthProfile?.activeSession || null
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
