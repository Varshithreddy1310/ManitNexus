import { useState, useEffect, useCallback } from 'react';
import {
  askAiQuestion,
  getAiChatHistory,
  deleteAiChatEntry,
  clearAiChatHistory
} from '../services/aiService';

/**
 * Custom hook for managing AI chat state: history, sending, deletion.
 */
export function useChat() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  // Load chat history on mount
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAiChatHistory();
      if (response.success && response.data?.chats) {
        setHistory(response.data.chats);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Send a new question
  const sendQuestion = useCallback(async (question) => {
    try {
      setSending(true);
      setError(null);
      const response = await askAiQuestion(question);

      if (response.success && response.data) {
        // Prepend new chat to history (newest first)
        const newChat = {
          _id: response.data.chatId,
          question,
          aiAnswer: response.data.answer,
          referencedPosts: response.data.referencedPosts || [],
          createdAt: new Date().toISOString()
        };
        setHistory(prev => [newChat, ...prev]);
        return response.data;
      }
      throw new Error(response.message || 'Failed to get AI response');
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setSending(false);
    }
  }, []);

  // Delete a single chat entry
  const deleteEntry = useCallback(async (chatId) => {
    try {
      setError(null);
      await deleteAiChatEntry(chatId);
      setHistory(prev => prev.filter(c => c._id !== chatId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  // Clear all chat history
  const clearAll = useCallback(async () => {
    try {
      setError(null);
      await clearAiChatHistory();
      setHistory([]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  return {
    history,
    loading,
    sending,
    error,
    sendQuestion,
    deleteEntry,
    clearAll,
    refreshHistory: fetchHistory
  };
}
