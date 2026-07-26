import express from 'express';
import { getSubscriptionStatus, activateSubscription } from '../controllers/subscriptionController.js';
import authUser from '../middleware/authUser.js';

const subscriptionRouter = express.Router();

subscriptionRouter.get('/status', authUser, getSubscriptionStatus);
subscriptionRouter.post('/activate', authUser, activateSubscription);

export default subscriptionRouter;
