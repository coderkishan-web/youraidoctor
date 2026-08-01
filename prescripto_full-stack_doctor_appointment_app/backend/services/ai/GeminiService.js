/**
 * Gemini Service for AI Medical Companion
 * Handles API calls to Google Gemini with timeouts, retries, and fallback options.
 */

import fetch from 'node-fetch';

export async function generateContent(systemPrompt = '', userMessage = '') {
    const apiKey = process.env.GEMINI_API_KEY;


    // Try Gemini API first
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [
                            { text: `${systemPrompt}\n\nUser Input: ${userMessage}\nCompanion Response:` }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7
                }
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                let text = data.candidates[0].content.parts[0].text.trim();
                return text;
            }
        }
    } catch (e) {
        console.error('[GeminiService] API call error or timeout:', e.message);
    }

    // Fallback to HuggingFace open-weight models if available
    const hfToken = process.env.HF_TOKEN || '';
    if (hfToken) {
        try {
            const res = await fetch('https://router.huggingface.co/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${hfToken}`
                },
                body: JSON.stringify({
                    model: 'Qwen/Qwen2.5-72B-Instruct',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userMessage }
                    ],
                    max_tokens: 350
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.choices?.[0]?.message?.content) {
                    return data.choices[0].message.content.trim();
                }
            }
        } catch (e) {
            console.error('[GeminiService] HuggingFace fallback error:', e.message);
        }
    }

    return null;
}
