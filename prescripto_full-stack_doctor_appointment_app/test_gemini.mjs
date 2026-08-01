// test_gemini.mjs
import { generateContent } from './backend/services/ai/GeminiService.js';

(async () => {
  const result = await generateContent('You are a helpful assistant.', 'Hello');
  console.log('Result:', result);
})();
