import AiChat from '../models/AiChat.js';
import { answerDoubt } from '../ai/doubtAnswerService.js';

// @desc    Ask an AI doubt question (RAG-powered)
// @route   POST /api/ai/ask
// @access  Protected (Student/Alumni) + Rate Limited
export const askQuestion = async (req, res) => {
  const { question } = req.body;

  if (!question || question.trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Question must be at least 5 characters long'
    });
  }

  try {
    // Call the RAG doubt-answering pipeline
    const { answer, referencedPosts } = await answerDoubt(question.trim());

    // Save the chat to history
    const chat = await AiChat.create({
      studentId: req.user._id,
      question: question.trim(),
      aiAnswer: answer,
      referencedPosts: referencedPosts.map(p => p._id)
    });

    res.status(200).json({
      success: true,
      data: {
        answer,
        referencedPosts,
        chatId: chat._id
      }
    });
  } catch (error) {
    console.error('AI Ask Error:', error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI answer'
    });
  }
};

// @desc    Get user's AI chat history
// @route   GET /api/ai/history
// @access  Protected
export const getChatHistory = async (req, res) => {
  try {
    const history = await AiChat.find({ studentId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('referencedPosts', 'content category authorName authorRole');

    res.status(200).json({
      success: true,
      data: {
        chats: history
      }
    });
  } catch (error) {
    console.error('Get Chat History Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving chat history'
    });
  }
};

// @desc    Delete a single chat entry
// @route   DELETE /api/ai/history/:id
// @access  Protected (only owner can delete)
export const deleteChatEntry = async (req, res) => {
  const { id } = req.params;

  try {
    const chat = await AiChat.findById(id);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat entry not found'
      });
    }

    // Ensure the user owns this chat entry
    if (chat.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this chat entry'
      });
    }

    await AiChat.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      data: { chatId: id },
      message: 'Chat entry deleted successfully'
    });
  } catch (error) {
    console.error('Delete Chat Entry Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error deleting chat entry'
    });
  }
};

// @desc    Clear all chat history for the current user
// @route   DELETE /api/ai/history
// @access  Protected
export const clearAllHistory = async (req, res) => {
  try {
    const result = await AiChat.deleteMany({ studentId: req.user._id });

    res.status(200).json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: 'All chat history cleared'
    });
  } catch (error) {
    console.error('Clear History Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error clearing chat history'
    });
  }
};
