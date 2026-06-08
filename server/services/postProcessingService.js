import Post from '../models/Post.js';
import { moderateContent } from '../ai/moderationService.js';
import { categorizeContent } from '../ai/categorizationService.js';
import { generateEmbedding } from '../ai/embeddingService.js';

/**
 * Executes the entire post moderation, categorization, and embedding pipeline asynchronously.
 * Designed to process in background without blocking the student's initial request.
 * @param {string} postId - MongoDB ObjectId string of the created post
 */
export async function processPost(postId) {
  console.log(`[AI Pipeline] Initiating processing for post: ${postId}`);

  try {
    const post = await Post.findById(postId);
    if (!post) {
      console.warn(`[AI Pipeline] Post ${postId} not found in database. Exiting.`);
      return;
    }

    // 1. Run live content moderation
    const modResult = await moderateContent(post.content);
    console.log(`[AI Pipeline] Moderation outcome for ${postId}:`, modResult);

    if (modResult.status === 'FLAGGED') {
      // Hide post from public feed and log reason
      await Post.findByIdAndUpdate(postId, {
        moderationStatus: 'flagged',
        moderationReason: modResult.reason || 'Content flagged by community guidelines safety filter'
      });
      console.log(`[AI Pipeline] Post ${postId} flagged and hidden successfully.`);
      return;
    }

    // 2. Run live categorization
    const category = await categorizeContent(post.content);
    console.log(`[AI Pipeline] Categorization outcome for ${postId}: '${category}'`);

    // 3. Generate offline embeddings
    const embedding = await generateEmbedding(post.content);
    console.log(`[AI Pipeline] Embeddings generated successfully (${embedding.length} dimensions).`);

    // 4. Commit results to MongoDB and set status to approved
    await Post.findByIdAndUpdate(postId, {
      moderationStatus: 'approved',
      category: category,
      embedding: embedding
    });

    console.log(`[AI Pipeline] Post ${postId} successfully approved, categorized, and embedded.`);
  } catch (error) {
    console.error(`[AI Pipeline] Error processing post ${postId}:`, error.message);
    
    // Safety fallback: if an external API fails, keep post as pending so admin can manually review
    // rather than locking it up permanently or deleting it.
  }
}
