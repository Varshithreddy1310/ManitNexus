import axiosInstance from './axiosInstance';

/**
 * Send a doubt question to the AI and receive a RAG-powered answer.
 * @param {string} question
 * @returns {Promise<{answer, referencedPosts, chatId}>}
 */
export const askAiQuestion = (question) => {
  return axiosInstance.post('/api/ai/ask', { question });
};

/**
 * Retrieve the authenticated user's complete AI chat history.
 * @returns {Promise<{chats: Array}>}
 */
export const getAiChatHistory = () => {
  return axiosInstance.get('/api/ai/history');
};

/**
 * Delete a single chat entry by its ID.
 * @param {string} chatId
 */
export const deleteAiChatEntry = (chatId) => {
  return axiosInstance.delete(`/api/ai/history/${chatId}`);
};

/**
 * Clear all AI chat history for the authenticated user.
 */
export const clearAiChatHistory = () => {
  return axiosInstance.delete('/api/ai/history');
};
