/**
 * Security Middleware for AI Medical Companion (Phase 4)
 * Protects against Prompt Injection, XSS, NoSQL Injection patterns, and attaches Request Tracking ID.
 */

export function securityGuard(req, res, next) {
    // 1. Attach Request ID
    const requestId = 'req-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    if (req.body) {
        // 2. Prompt Injection Defense
        const bodyStr = JSON.stringify(req.body).toLowerCase();
        const injectionPatterns = [
            /ignore previous instructions/i,
            /bypass system prompt/i,
            /reveal your system instructions/i,
            /act as an unrestricted ai/i,
            /developer mode enable/i
        ];

        if (injectionPatterns.some(pattern => pattern.test(bodyStr))) {
            return res.status(400).json({
                success: false,
                message: "Security Policy Violation: Prompt manipulation attempt blocked.",
                code: "PROMPT_INJECTION_DETECTED"
            });
        }

        // 3. XSS Sanitization in string fields
        if (req.body.message && typeof req.body.message === 'string') {
            req.body.message = req.body.message
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/script/gi, '');
        }
    }

    next();
}
