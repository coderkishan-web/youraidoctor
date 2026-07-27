/**
 * Session Manager for AI Medical Companion
 * Handles retrieval and persistence of user session state and memory in database.
 */

import userModel from '../../models/userModel.js';
import { createInitialMemory } from './MemoryEngine.js';

export async function loadUserSession(userId) {
    if (!userId) return null;
    const user = await userModel.findById(userId).select('-password');
    if (!user) return null;

    const healthProfile = user.healthProfile || {};
    const structuredMemory = healthProfile.structuredMemory || createInitialMemory();

    return {
        user,
        healthProfile,
        structuredMemory,
        chatHistory: user.aiChatHistory || []
    };
}

export async function saveUserSession(userId, updatedHealthProfile, updatedChatHistory) {
    if (!userId) return false;
    await userModel.findByIdAndUpdate(userId, {
        healthProfile: updatedHealthProfile,
        aiChatHistory: updatedChatHistory
    });
    return true;
}
