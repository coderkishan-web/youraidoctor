import express from 'express';
import { getReminders, addReminder, toggleReminder } from '../controllers/reminderController.js';
import authUser from '../middleware/authUser.js';

const reminderRouter = express.Router();

reminderRouter.get('/list', authUser, getReminders);
reminderRouter.post('/add', authUser, addReminder);
reminderRouter.post('/toggle', authUser, toggleReminder);

export default reminderRouter;
