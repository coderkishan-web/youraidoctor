import userModel from '../models/userModel.js';

// Controller: Log Daily Vitals (BP, Glucose, Heart Rate, SpO2)
export const logVitals = async (req, res) => {
    try {
        const { userId, sysBP, diaBP, glucose, heartRate, spo2 } = req.body;
        if (!userId) {
            return res.json({ success: false, message: "User ID is required" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const entry = {
            id: 'vitals-' + Date.now(),
            bp: `${sysBP || 120}/${diaBP || 80} mmHg`,
            glucose: `${glucose || 95} mg/dL`,
            heartRate: `${heartRate || 72} bpm`,
            spo2: `${spo2 || 98} %`,
            loggedAt: new Date().toISOString()
        };

        const vitalsLog = user.vitalsLog || [];
        vitalsLog.unshift(entry);

        await userModel.findByIdAndUpdate(userId, { vitalsLog });

        res.json({
            success: true,
            message: "Health vitals recorded successfully",
            entry,
            vitalsLog
        });

    } catch (error) {
        console.error("Log Vitals Error:", error);
        res.json({ success: false, message: error.message });
    }
};

// Controller: Get User Vitals History
export const getVitalsHistory = async (req, res) => {
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
            vitalsLog: user.vitalsLog || []
        });

    } catch (error) {
        console.error("Get Vitals Error:", error);
        res.json({ success: false, message: error.message });
    }
};
