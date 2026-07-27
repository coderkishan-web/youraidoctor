/**
 * Structured Logger for AI Medical Companion (Phase 4)
 * Provides structured JSON logging with level filtering and automatic PII masking.
 */

export const LOG_LEVELS = {
    DEBUG: 10,
    INFO: 20,
    WARN: 30,
    ERROR: 40,
    FATAL: 50
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

function maskPII(data) {
    if (!data) return data;
    if (typeof data === 'string') {
        return data
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[MASKED_EMAIL]')
            .replace(/\b\d{10}\b/g, '[MASKED_PHONE]')
            .replace(/bearer\s+[a-zA-Z0-9._-]+/gi, 'Bearer [MASKED_TOKEN]');
    }
    if (typeof data === 'object') {
        const maskedObj = { ...data };
        ['password', 'token', 'email', 'phone'].forEach(key => {
            if (maskedObj[key]) maskedObj[key] = '[MASKED]';
        });
        return maskedObj;
    }
    return data;
}

function log(levelName, message, context = {}) {
    if (LOG_LEVELS[levelName] < currentLevel) return;

    const logEntry = {
        timestamp: new Date().toISOString(),
        level: levelName,
        message: maskPII(message),
        requestId: context.requestId || 'sys-internal',
        sessionId: context.sessionId || 'N/A',
        intent: context.intent || 'N/A',
        latencyMs: context.latencyMs || null,
        tokenUsage: context.tokenUsage || null
    };

    if (levelName === 'ERROR' || levelName === 'FATAL') {
        console.error(JSON.stringify(logEntry));
    } else if (levelName === 'WARN') {
        console.warn(JSON.stringify(logEntry));
    } else {
        console.log(JSON.stringify(logEntry));
    }
}

export const logger = {
    debug: (msg, ctx) => log('DEBUG', msg, ctx),
    info: (msg, ctx) => log('INFO', msg, ctx),
    warn: (msg, ctx) => log('WARN', msg, ctx),
    error: (msg, ctx) => log('ERROR', msg, ctx),
    fatal: (msg, ctx) => log('FATAL', msg, ctx)
};
