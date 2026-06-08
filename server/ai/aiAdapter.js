import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Ordered list of free models to try. If the primary model is rate-limited
// or unavailable, the adapter automatically falls through to the next one.
const FREE_MODEL_FALLBACKS = [
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'nvidia/nemotron-nano-9b-v2:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemma-4-26b-a4b-it:free',
  'deepseek/deepseek-v4-flash:free',
  'qwen/qwen3-coder:free',
];

/**
 * Sends a chat completion request to OpenRouter with automatic model fallback.
 * If the primary model fails (rate-limited, 404, 5xx), the next model in the
 * fallback list is tried. This makes the AI feature resilient to free-tier
 * model churn and per-model rate limits on OpenRouter.
 *
 * @param {string} prompt - The main prompt instruction
 * @param {string} systemInstruction - The optional system guidelines
 * @returns {Promise<string>} - The model's text response
 */
export async function generateText(prompt, systemInstruction = '') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const envModel = process.env.OPENROUTER_MODEL;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not defined in environment variables');
  }

  const messages = [];

  if (systemInstruction) {
    messages.push({
      role: 'system',
      content: systemInstruction
    });
  }

  messages.push({
    role: 'user',
    content: prompt
  });

  // Build ordered model list: env model first (if set), then fallbacks
  const modelsToTry = envModel
    ? [envModel, ...FREE_MODEL_FALLBACKS.filter(m => m !== envModel)]
    : [...FREE_MODEL_FALLBACKS];

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:5173',
          'X-Title': 'Manit Nexus'
        },
        body: JSON.stringify({
          model: modelName,
          messages: messages,
          temperature: 0.2
        })
      });

      // If rate-limited (429), model gone (404), or server error (5xx), try next model
      if (response.status === 429 || response.status === 404 || response.status >= 500) {
        const errText = await response.text();
        console.warn(`[AI Adapter] Model ${modelName} returned ${response.status}, trying next fallback...`);
        lastError = new Error(`Model ${modelName}: status ${response.status} — ${errText.substring(0, 150)}`);
        continue;
      }

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API responded with status ${response.status}: ${errText}`);
      }

      const result = await response.json();

      if (result.choices && result.choices.length > 0) {
        console.log(`[AI Adapter] Successfully used model: ${modelName}`);
        return result.choices[0].message.content.trim();
      } else {
        console.warn(`[AI Adapter] Model ${modelName} returned empty choices, trying next...`);
        lastError = new Error(`Model ${modelName} returned empty choices`);
        continue;
      }
    } catch (error) {
      console.warn(`[AI Adapter] Model ${modelName} failed: ${error.message}`);
      lastError = error;
      continue;
    }
  }

  // All models exhausted
  console.error('[AI Adapter] All models exhausted. Last error:', lastError?.message);
  throw new Error(
    'All AI models are temporarily unavailable (rate-limited). Please try again in a few minutes.'
  );
}
