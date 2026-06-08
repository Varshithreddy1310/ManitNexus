import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, MessageSquare, Trash2, X, Menu, 
  Bot, User, Sparkles, Clock, ChevronDown, ChevronUp,
  AlertCircle, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useChat } from '../hooks/useChat';
import RoleBadge from '../components/RoleBadge';
import SkeletonMessage from '../components/SkeletonMessage';

const ChatPage = () => {
  const { history, loading, sending, sendQuestion, deleteEntry, clearAll } = useChat();
  const [question, setQuestion] = useState('');
  const [activeChat, setActiveChat] = useState(null); // currently viewed chat
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat, sending]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!question.trim() || sending) return;

    const q = question.trim();
    setQuestion('');
    setActiveChat({ question: q, aiAnswer: null, referencedPosts: [], _id: 'pending' });

    try {
      const data = await sendQuestion(q);
      setActiveChat({
        _id: data.chatId,
        question: q,
        aiAnswer: data.answer,
        referencedPosts: data.referencedPosts || [],
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      if (err.status === 429) {
        toast.error("You've reached your hourly limit. Try again later.");
      } else {
        toast.error(err.message || 'Failed to get AI response');
      }
      setActiveChat(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectChat = (chat) => {
    setActiveChat(chat);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteEntry = async (chatId, e) => {
    e.stopPropagation();
    try {
      await deleteEntry(chatId);
      if (activeChat?._id === chatId) {
        setActiveChat(null);
      }
      toast.success('Chat entry deleted');
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) return;
    try {
      await clearAll();
      setActiveChat(null);
      toast.success('Chat history cleared');
    } catch (err) {
      toast.error('Failed to clear history');
    }
  };

  const handleNewChat = () => {
    setActiveChat(null);
    inputRef.current?.focus();
  };

  const toggleSources = (chatId) => {
    setExpandedSources(prev => ({ ...prev, [chatId]: !prev[chatId] }));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="chat-page">
      {/* Mobile sidebar toggle */}
      <button 
        className="chat-sidebar-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        id="chat-sidebar-toggle"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar - Chat History */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside 
            className="chat-sidebar"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="chat-sidebar-header">
              <h3 className="chat-sidebar-title">
                <MessageSquare size={18} />
                Chat History
              </h3>
              <div className="chat-sidebar-actions">
                <button 
                  className="chat-btn-new" 
                  onClick={handleNewChat}
                  id="new-chat-btn"
                >
                  <Sparkles size={14} />
                  New Chat
                </button>
                {history.length > 0 && (
                  <button 
                    className="chat-btn-clear" 
                    onClick={handleClearAll}
                    id="clear-all-btn"
                  >
                    <Trash2 size={14} />
                    Clear All
                  </button>
                )}
              </div>
            </div>

            <div className="chat-sidebar-list">
              {loading ? (
                <div className="chat-sidebar-loading">
                  <Loader2 size={20} className="spin" />
                  <span>Loading history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="chat-sidebar-empty">
                  <Bot size={32} />
                  <p>No chat history yet</p>
                  <span>Ask your first question!</span>
                </div>
              ) : (
                history.map((chat) => (
                  <motion.div
                    key={chat._id}
                    className={`chat-history-item ${activeChat?._id === chat._id ? 'active' : ''}`}
                    onClick={() => handleSelectChat(chat)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="chat-history-item-content">
                      <p className="chat-history-question">{chat.question}</p>
                      <span className="chat-history-time">
                        <Clock size={12} />
                        {formatTime(chat.createdAt)}
                      </span>
                    </div>
                    <button 
                      className="chat-history-delete"
                      onClick={(e) => handleDeleteEntry(chat._id, e)}
                      title="Delete this chat"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className={`chat-main ${sidebarOpen ? 'with-sidebar' : ''}`}>
        {!activeChat && !sending ? (
          /* Welcome / Empty State */
          <motion.div 
            className="chat-welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="chat-welcome-icon">
              <Bot size={48} />
            </div>
            <h2>Manit Nexus AI</h2>
            <p>Ask anything about college life, placements, exams, or hostel experiences. I'll search through community knowledge to give you the best answers.</p>
            <div className="chat-suggestions">
              {[
                'How was the Infosys hiring process at MANIT?',
                'Tips for DBMS semester exam preparation?',
                'Best hostels in MANIT and why?',
                'How to prepare for campus placements?'
              ].map((suggestion, i) => (
                <button
                  key={i}
                  className="chat-suggestion-chip"
                  onClick={() => {
                    setQuestion(suggestion);
                    inputRef.current?.focus();
                  }}
                >
                  <Sparkles size={14} />
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Active Chat Messages */
          <div className="chat-messages">
            {activeChat && (
              <>
                {/* User Message */}
                <motion.div 
                  className="chat-message user"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <div className="chat-message-avatar user-avatar">
                    <User size={18} />
                  </div>
                  <div className="chat-message-bubble user-bubble">
                    <p>{activeChat.question}</p>
                  </div>
                </motion.div>

                {/* AI Response */}
                {activeChat.aiAnswer ? (
                  <motion.div 
                    className="chat-message ai"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="chat-message-avatar ai-avatar">
                      <Bot size={18} />
                    </div>
                    <div className="chat-message-content">
                      <div className="chat-message-bubble ai-bubble ui-card">
                        <p style={{ whiteSpace: 'pre-wrap' }}>{activeChat.aiAnswer}</p>
                      </div>

                      {/* Referenced Sources */}
                      {activeChat.referencedPosts && activeChat.referencedPosts.length > 0 && (
                        <div className="chat-sources">
                          <button 
                            className="chat-sources-toggle"
                            onClick={() => toggleSources(activeChat._id)}
                          >
                            <Sparkles size={14} />
                            Sources from MANIT community ({activeChat.referencedPosts.length})
                            {expandedSources[activeChat._id] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          
                          <AnimatePresence>
                            {expandedSources[activeChat._id] && (
                              <motion.div 
                                className="chat-sources-list"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                              >
                                {activeChat.referencedPosts.map((post, idx) => (
                                  <div key={post._id || idx} className="chat-source-card ui-card">
                                    <div className="chat-source-header">
                                      <span className="chat-source-author">{post.authorName}</span>
                                      {post.authorRole && <RoleBadge role={post.authorRole} />}
                                      {post.category && (
                                        <span className="chat-source-category">{post.category}</span>
                                      )}
                                    </div>
                                    <p className="chat-source-content">
                                      {post.content?.length > 200 
                                        ? post.content.substring(0, 200) + '...' 
                                        : post.content}
                                    </p>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  /* Typing Indicator / Skeleton */
                  <motion.div 
                    className="chat-message ai"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <SkeletonMessage />
                  </motion.div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="chat-input-area">
          <div className="chat-input-container ui-card">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask anything about MANIT..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={sending}
              id="chat-input"
            />
            <button 
              className={`chat-send-btn ${question.trim() && !sending ? 'active' : ''}`}
              onClick={handleSend}
              disabled={!question.trim() || sending}
              id="chat-send-btn"
            >
              {sending ? <Loader2 size={20} className="spin" /> : <Send size={20} />}
            </button>
          </div>
          <p className="chat-rate-info">
            <AlertCircle size={12} />
            AI responses are limited to 20 per hour
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
