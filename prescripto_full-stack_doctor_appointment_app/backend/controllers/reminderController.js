import { readJson, writeJson, nextId } from '../models/jsonHelper.js';

const FILE = 'reminders.json';

export const getReminders = async (req, res) => {
    try {
        const { userId } = req.body;
        const allReminders = readJson(FILE) || [];
        const userReminders = allReminders.filter(r => String(r.userId) === String(userId));
        res.json({ success: true, reminders: userReminders });
    } catch (error) {
        console.error("Get Reminders Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export const addReminder = async (req, res) => {
    try {
        const { userId, title, time, type = 'Medication', frequency = 'Daily' } = req.body;
        if (!title || !time) {
            return res.json({ success: false, message: 'Title and Time are required' });
        }

        const allReminders = readJson(FILE) || [];
        const newReminder = {
            _id: String(nextId(allReminders)),
            userId: String(userId),
            title,
            time,
            type,
            frequency,
            active: true,
            createdAt: Date.now()
        };

        allReminders.push(newReminder);
        writeJson(FILE, allReminders);

        res.json({ success: true, message: 'Reminder set successfully', reminder: newReminder });
    } catch (error) {
        console.error("Add Reminder Error:", error);
        res.json({ success: false, message: error.message });
    }
};

export const toggleReminder = async (req, res) => {
    try {
        const { userId, reminderId } = req.body;
        const allReminders = readJson(FILE) || [];
        const idx = allReminders.findIndex(r => String(r._id) === String(reminderId) && String(r.userId) === String(userId));

        if (idx !== -1) {
            allReminders[idx].active = !allReminders[idx].active;
            writeJson(FILE, allReminders);
            return res.json({ success: true, message: 'Reminder updated', reminder: allReminders[idx] });
        }

        res.json({ success: false, message: 'Reminder not found' });
    } catch (error) {
        console.error("Toggle Reminder Error:", error);
        res.json({ success: false, message: error.message });
    }
};
