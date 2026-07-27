/**
 * Feedback Engine for AI Medical Companion (Phase 4)
 * Captures anonymized user feedback ratings for offline quality improvement reports.
 */

const feedbackStore = [];

export function recordFeedback({ messageId, rating, category = 'General', comments = '' }) {
    if (!messageId || !rating) {
        throw new Error('Message ID and Rating are required');
    }

    const entry = {
        id: 'fb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        messageId,
        rating, // 'Helpful' | 'Not Helpful' | 'Unsafe' | 'Confusing' | 'Incomplete'
        category,
        comments,
        timestamp: new Date().toISOString()
    };

    feedbackStore.push(entry);
    if (feedbackStore.length > 2000) {
        feedbackStore.shift();
    }

    return entry;
}

export function getFeedbackSummary() {
    const total = feedbackStore.length;
    const helpfulCount = feedbackStore.filter(f => f.rating === 'Helpful').length;
    const unsafeCount = feedbackStore.filter(f => f.rating === 'Unsafe').length;

    return {
        totalFeedbackEntries: total,
        helpfulPercentage: total > 0 ? `${((helpfulCount / total) * 100).toFixed(1)}%` : '100%',
        unsafeFlags: unsafeCount,
        recentEntries: feedbackStore.slice(-10)
    };
}
