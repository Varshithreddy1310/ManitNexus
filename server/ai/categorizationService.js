import { generateText } from './aiAdapter.js';

const SYSTEM_INSTRUCTION = 'You are an expert college taxonomy classification service. You only respond with one exact category name.';

const VALID_CATEGORIES = [
  "Semester Exam Tips",
  "Placement Experiences",
  "Coding Resources",
  "Hostel Reviews",
  "Faculty Reviews",
  "Career Advice",
  "Others"
];

/**
 * Categorizes a post's content into one of the 7 official community categories using OpenRouter.
 * @param {string} postContent - The text body of the post
 * @returns {Promise<string>} - The matching category name
 */
export async function categorizeContent(postContent) {
  const prompt = `
You are categorizing posts for a college knowledge platform.

Classify the following post into EXACTLY ONE of these categories:
- Semester Exam Tips
- Placement Experiences
- Coding Resources
- Hostel Reviews
- Faculty Reviews
- Career Advice
- Others

Post content:
"""
${postContent}
"""

Respond with ONLY the category name, nothing else.
`;

  try {
    const rawResult = await generateText(prompt, SYSTEM_INSTRUCTION);
    const cleanedResult = rawResult.trim().replace(/^['"\s]+|['"\s]+$/g, ''); // Strip quotes and extra spaces

    // Match against official enums (case insensitive helper)
    const matchedCategory = VALID_CATEGORIES.find(
      cat => cat.toLowerCase() === cleanedResult.toLowerCase()
    );

    if (matchedCategory) {
      return matchedCategory;
    }

    // Secondary soft inclusion check (e.g. if model output contains the category name)
    const softMatchedCategory = VALID_CATEGORIES.find(
      cat => cleanedResult.toLowerCase().includes(cat.toLowerCase())
    );

    return softMatchedCategory || "Others";
  } catch (error) {
    console.error('Categorization Service Error:', error.message);
    return "Others"; // Fallback to safe category
  }
}
