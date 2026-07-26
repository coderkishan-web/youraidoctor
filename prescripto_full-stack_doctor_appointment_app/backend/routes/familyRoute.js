import express from 'express';
import { addFamilyMember, getFamilyMembers, removeFamilyMember } from '../controllers/familyController.js';
import authUser from '../middleware/authUser.js';

const familyRouter = express.Router();

familyRouter.post('/add', authUser, addFamilyMember);
familyRouter.get('/list', authUser, getFamilyMembers);
familyRouter.post('/remove', authUser, removeFamilyMember);

export default familyRouter;
