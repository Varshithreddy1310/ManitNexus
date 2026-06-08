import Post from '../models/Post.js';
import { generateEmbedding } from '../ai/embeddingService.js';

/**
 * Searches for semantically similar approved posts using MongoDB Atlas Vector Search.
 * Falls back to text-based keyword search if vector index is unavailable.
 *
 * @param {string} queryText - The user's question text
 * @param {number} limit - Maximum number of results (default 5)
 * @returns {Promise<Array<{_id, content, category, authorName, authorRole, score}>>}
 */
export async function findSimilarPosts(queryText, limit = 5) {
  try {
    // Generate embedding for the query
    const queryVector = await generateEmbedding(queryText);

    // Attempt Atlas Vector Search first
    try {
      const vectorResults = await Post.aggregate([
        {
          $vectorSearch: {
            index: 'post_embeddings',
            path: 'embedding',
            queryVector: queryVector,
            numCandidates: 50,
            limit: limit,
            filter: { moderationStatus: 'approved' }
          }
        },
        {
          $project: {
            content: 1,
            category: 1,
            authorName: 1,
            authorRole: 1,
            upvotes: 1,
            downvotes: 1,
            createdAt: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]);

      if (vectorResults && vectorResults.length > 0) {
        console.log(`[VectorSearch] Found ${vectorResults.length} results via Atlas Vector Search`);
        return vectorResults;
      }
    } catch (vectorError) {
      console.warn('[VectorSearch] Atlas Vector Search unavailable, falling back to keyword search:', vectorError.message);
    }

    // Fallback: keyword-based search using regex matching
    return await fallbackKeywordSearch(queryText, limit);
  } catch (error) {
    console.error('[VectorSearch] Error in findSimilarPosts:', error.message);
    return await fallbackKeywordSearch(queryText, limit);
  }
}

/**
 * Fallback search using text keyword matching when vector search is unavailable.
 * Extracts meaningful keywords from the query and searches post content.
 *
 * @param {string} queryText - The user's question
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>}
 */
async function fallbackKeywordSearch(queryText, limit = 5) {
  // Extract meaningful keywords (remove common stop words)
  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'can', 'shall', 'to', 'of', 'in', 'for',
    'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
    'before', 'after', 'above', 'below', 'between', 'out', 'about',
    'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
    'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
    'other', 'some', 'such', 'than', 'too', 'very', 'just', 'because',
    'how', 'what', 'which', 'who', 'whom', 'this', 'that', 'these',
    'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your',
    'he', 'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their'
  ]);

  const keywords = queryText
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  if (keywords.length === 0) {
    return [];
  }

  // Build regex OR pattern from keywords
  const regexPattern = keywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  
  const results = await Post.find({
    moderationStatus: 'approved',
    content: { $regex: regexPattern, $options: 'i' }
  })
    .sort({ upvotes: -1, createdAt: -1 })
    .limit(limit)
    .select('content category authorName authorRole upvotes downvotes createdAt')
    .lean();

  // Assign a synthetic score based on keyword match density
  return results.map(post => {
    const contentLower = post.content.toLowerCase();
    const matchCount = keywords.filter(k => contentLower.includes(k)).length;
    return {
      ...post,
      score: matchCount / keywords.length // 0.0 to 1.0
    };
  });
}
