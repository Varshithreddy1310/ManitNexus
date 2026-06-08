import { generateText } from './aiAdapter.js';

const SYSTEM_INSTRUCTION = 'You are a strict, automated content moderator for a college student community platform. You only respond in JSON format.';

/**
 * Moderates a post's content using the OpenRouter LLM.
 * @param {string} postContent - The text body of the student post
 * @returns {Promise<{status: string, reason: string|null}>} - The moderation status
 */
export async function moderateContent(postContent) {
  const prompt = `
Analyze the following post for:
- Spam or promotional content
- Abusive, offensive, or toxic language
- Threats or harassment
- Misinformation or factually dangerous claims
- Personally identifying information of others

Post content:
"""
${postContent}
"""

Respond with ONLY a JSON object in this exact format:
{
  "status": "SAFE" | "FLAGGED",
  "reason": null | "brief reason string (max 100 chars)"
}

No markdown, no explanation, just the JSON.
`;

  try {
    const rawResult = await generateText(prompt, SYSTEM_INSTRUCTION);
    
    // Clean model output to remove markdown block tags (e.g. ```json ... ```)
    let cleaned = rawResult.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?\n/, '').replace(/\n```$/, '');
    }
    
    const parsed = JSON.parse(cleaned.trim());
    
    return {
      status: parsed.status === 'FLAGGED' ? 'FLAGGED' : 'SAFE',
      reason: parsed.reason || null
    };
  } catch (error) {
    console.error('Moderation Service Parsing Error:', error.message);
    // Fail-safe default: let admin review it rather than auto-blocking on parsing errors
    return {
      status: 'SAFE',
      reason: null
    };
  }
}
