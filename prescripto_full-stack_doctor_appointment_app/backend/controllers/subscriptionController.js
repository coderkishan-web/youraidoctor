import userModel from '../models/userModel.js';
import doctorModel from '../models/doctorModel.js';

export const getSubscriptionStatus = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const now = Date.now();
        let sub = user.subscription || {
            plan: 'patient_100',
            status: 'trial',
            trialStartDate: now,
            trialEndDate: now + 7 * 24 * 60 * 60 * 1000,
            price: 100
        };

        // Check if trial expired
        if (sub.status === 'trial' && now > sub.trialEndDate) {
            sub.status = 'expired';
            await userModel.findByIdAndUpdate(userId, { subscription: sub });
        }

        const daysRemaining = sub.status === 'trial'
            ? Math.max(0, Math.ceil((sub.trialEndDate - now) / (1000 * 60 * 60 * 24)))
            : 0;

        res.json({
            success: true,
            subscription: sub,
            daysRemaining,
            isTrialActive: sub.status === 'trial',
            isSubscribed: sub.status === 'active'
        });
    } catch (error) {
        console.error("Subscription Status Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export const activateSubscription = async (req, res) => {
    try {
        const { userId, planType = 'patient_100' } = req.body;
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }

        const now = Date.now();
        const price = planType === 'doctor_300' ? 300 : 100;
        const newSub = {
            plan: planType,
            status: 'active',
            activatedAt: now,
            expiresAt: now + 30 * 24 * 60 * 60 * 1000, // 30 days
            price: price,
            currency: 'INR'
        };

        await userModel.findByIdAndUpdate(userId, { subscription: newSub });

        res.json({ success: true, message: `Successfully subscribed to ₹${price}/month Plan!`, subscription: newSub });
    } catch (error) {
        console.error("Activate Subscription Error:", error);
        res.json({ success: false, message: error.message });
    }
};
