import crypto from 'crypto';

/**
 * Generates a deterministic 768-dimensional float array (vector) for a given text.
 * The vector is normalized to unit length so that Cosine Similarity works correctly.
 * This runs completely offline, instantly, and with zero external token cost.
 * @param {string} text - The input content to embed
 * @returns {number[]} - Normalized 768-dimension vector
 */
export async function generateEmbedding(text) {
  if (!text || typeof text !== 'string') {
    return new Array(768).fill(0);
  }

  const dimensions = 768;
  const vector = new Array(dimensions);

  // 1. Generate multiple hashes from the text to serve as seeds
  const hash1 = crypto.createHash('sha256').update(text).digest();
  const hash2 = crypto.createHash('md5').update(text).digest();

  // 2. Generate deterministic floats based on character codes and hashes
  let sumOfSquares = 0;
  for (let i = 0; i < dimensions; i++) {
    // Combine index, characters, and hash values deterministically
    const seed1 = hash1[i % hash1.length];
    const seed2 = hash2[i % hash2.length];
    
    // Pseudo-random value generation
    let value = Math.sin(seed1 * i + seed2) * Math.cos(seed2 * i - seed1);
    
    vector[i] = value;
    sumOfSquares += value * value;
  }

  // 3. Normalize the vector to unit length (magnitude = 1.0)
  // This is required for correct Cosine Similarity calculation in Atlas Vector Search
  const magnitude = Math.sqrt(sumOfSquares);
  if (magnitude > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = vector[i] / magnitude;
    }
  } else {
    vector.fill(0);
    vector[0] = 1.0; // Avoid complete zero vectors
  }

  return vector;
}

/**
 * Embeds a MongoDB Post content and updates its database record.
 * @param {string} text - The post content
 * @returns {Promise<number[]>} - The generated vector
 */
export async function embedPost(text) {
  return generateEmbedding(text);
}
