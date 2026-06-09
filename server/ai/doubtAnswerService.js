import { generateText } from './aiAdapter.js';
import { findSimilarPosts } from '../services/vectorSearchService.js';

const RELEVANCE_THRESHOLD = 0.5; // Higher threshold to only include truly relevant posts

/**
 * Answers a student's doubt using RAG (Retrieval Augmented Generation).
 * If relevant community posts are found, they are used as context.
 * Otherwise, falls back to general knowledge.
 *
 * @param {string} question - The student's question
 * @returns {Promise<{answer: string, referencedPosts: Array}>}
 */
export async function answerDoubt(question) {
  try {
    // Step 1: Search for relevant community posts
    const similarPosts = await findSimilarPosts(question, 2);

    // Step 2: Filter by relevance threshold
    const relevantPosts = similarPosts.filter(p => p.score >= RELEVANCE_THRESHOLD);

    let answer;
    let referencedPosts = [];

    if (relevantPosts.length > 0) {
      // RAG path: use community posts as context
      answer = await generateRAGAnswer(question, relevantPosts);
      referencedPosts = relevantPosts.map(p => ({
        _id: p._id,
        content: p.content,
        category: p.category,
        authorName: p.authorName,
        authorRole: p.authorRole
      }));
    } else {
      // Fallback path: general knowledge
      answer = await generateFallbackAnswer(question);
    }

    return { answer, referencedPosts };
  } catch (error) {
    console.error('[DoubtAnswerService] Error:', error.message);
    throw new Error('Failed to generate AI answer. Please try again.');
  }
}

/**
 * Generates an answer using retrieved community posts as context (RAG).
 */
async function generateRAGAnswer(question, posts) {
  const postsContext = posts
    .map((p, i) => `${i + 1}. [${p.category}] by ${p.authorName} (${p.authorRole}): "${p.content}"`)
    .join('\n\n');

  const systemInstruction = `You are an AI assistant for MANIT Bhopal students. Answer the student's question using the relevant community posts provided below as your primary knowledge source.

Be concise, practical, and specific to MANIT context. 
Format your answer in clear paragraphs. Do not use bullet points unless listing steps.
If the community posts directly address the question, synthesize the information.
If posts are only partially relevant, supplement with your general knowledge.`;

  const prompt = `Student's Question:
${question}

Relevant Community Posts:
${postsContext}

Answer:`;

  return await generateText(prompt, systemInstruction);
}

/**
 * Generates an answer using general knowledge when no relevant posts exist.
 */
async function generateFallbackAnswer(question) {
  const systemInstruction = `You are an AI assistant for MANIT Bhopal students. 
Answer the following question based on your general knowledge about Indian engineering colleges, 
placements, and college life. Be helpful and practical.
If you don't know specific details about MANIT, say so honestly and provide general guidance.`;

  const prompt = `Question:
${question}

Answer:`;

  return await generateText(prompt, systemInstruction);
}
