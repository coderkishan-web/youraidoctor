import userModel from '../models/userModel.js';

export const addFamilyMember = async (req, res) => {
    try {
        const { userId, name, relation, age, bloodGroup, medicalNotes } = req.body;

        if (!name || !relation) {
            return res.json({ success: false, message: 'Name and Relation are required' });
        }

        const user = await userModel.findById(userId);
        const familyMembers = user.familyMembers || [];

        const newMember = {
            id: 'FAM-' + Date.now(),
            name,
            relation,
            age: age || 'Not specified',
            bloodGroup: bloodGroup || 'O+',
            medicalNotes: medicalNotes || 'No notes',
            addedAt: new Date().toISOString()
        };

        familyMembers.push(newMember);

        await userModel.findByIdAndUpdate(userId, { familyMembers });
        res.json({ success: true, message: 'Family member added successfully', familyMembers });
    } catch (error) {
        console.error("Family Add Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export const getFamilyMembers = async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await userModel.findById(userId);
        res.json({ success: true, familyMembers: user.familyMembers || [] });
    } catch (error) {
        console.error("Family Get Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export const removeFamilyMember = async (req, res) => {
    try {
        const { userId, memberId } = req.body;
        const user = await userModel.findById(userId);
        let familyMembers = user.familyMembers || [];

        familyMembers = familyMembers.filter(m => m.id !== memberId);

        await userModel.findByIdAndUpdate(userId, { familyMembers });
        res.json({ success: true, message: 'Family member removed', familyMembers });
    } catch (error) {
        console.error("Family Remove Error:", error);
        res.json({ success: false, message: error.message });
    }
};
