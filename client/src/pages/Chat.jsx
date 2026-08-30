import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { chatApi } from '../services/api';
import MessageBubble from '../components/MessageBubble/MessageBubble';
import ChatInput from '../components/ChatWindow/ChatInput';
import TypingIndicator from '../components/ChatWindow/TypingIndicator';
import SuggestedQuestions from '../components/SuggestedQuestions/SuggestedQuestions';
import LoadingSpinner from '../components/Loading/LoadingSpinner';
import {
  MessageSquare,
  Plus,
  Trash2,
  Sparkles,
  Bot,
  AlertCircle,
  GraduationCap,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export const Chat = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSessionId = searchParams.get('session');

  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Load Sessions & Suggestions on Mount
  useEffect(() => {
    loadSessions();
    loadSuggestions();
  }, []);

  // Load Active Session Messages when activeSessionId changes
  useEffect(() => {
    if (activeSessionId) {
      loadSessionMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId]);

  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await chatApi.getSessions();
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to load chat sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const res = await chatApi.getSuggestions();
      setSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error('Failed to load suggestions:', err);
    }
  };

  const loadSessionMessages = async (sessionId) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await chatApi.getSession(sessionId);
      setMessages(res.data.messages || []);
    } catch (err) {
      setError('Failed to load conversation history.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setSearchParams({});
    setMessages([]);
    setError(null);
  };

  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSendMessage = async (text, category = null, department = null) => {
    if (!text.trim()) return;

    setError(null);

    // Optimistic user message
    const tempUserMsg = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await chatApi.askQuestion(text, activeSessionId, category, department);
      const data = res.data;

      // Update URL if new session was created
      if (!activeSessionId && data.session_id) {
        setSearchParams({ session: data.session_id });
        loadSessions();
      }

      const assistantMsg = {
        id: data.message_id,
        role: 'assistant',
        content: data.answer,
        model: data.model,
        latency: data.latency,
        is_grounded: data.is_grounded,
        sources: data.sources || [],
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Failed to generate answer. Please try again.';
      setError(errorMsg);
      // Remove optimistic message if failure
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden">
      
      {/* Session History Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-0 -translate-x-full'
        } transition-all duration-300 ease-in-out border-r border-slate-800 bg-slate-950/95 flex flex-col flex-shrink-0 z-20`}
      >
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Conversation</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Your Conversations
          </div>

          {loadingSessions ? (
            <LoadingSpinner size="sm" text="Loading history..." />
          ) : sessions.length === 0 ? (
            <div className="text-xs text-slate-400 text-center py-6 px-3">
              No conversations yet. Ask your first question!
            </div>
          ) : (
            sessions.map((s) => {
              const isSelected = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => setSearchParams({ session: s.id })}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-6">
                    <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 group-hover:text-brand-400" />
                    <span className="truncate font-medium">{s.title}</span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteSession(e, s.id)}
                    title="Delete conversation"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Student Profile Footnote */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold text-xs">
            {user?.name ? user.name[0].toUpperCase() : 'S'}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
            <div className="text-[10px] text-slate-400 truncate">{user?.email}</div>
          </div>
        </div>
      </aside>

      {/* Main Chat Interface */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 relative">
        
        {/* Toggle Sidebar Button */}
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shadow-md"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-4xl w-full mx-auto space-y-4">
          
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <span className="font-semibold">Retrieval Notice:</span> {error}
              </div>
            </div>
          )}

          {/* Empty State / Welcome Screen */}
          {messages.length === 0 && !isLoading && (
            <div className="py-12 flex flex-col items-center text-center space-y-6 max-w-lg mx-auto animate-fade-in">
              <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-brand-500/25">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">How can I assist you today?</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  I can retrieve verified information regarding admissions, fee structures, hostel rules, academic regulations, exam dates, and placement policies.
                </p>
              </div>

              <SuggestedQuestions
                suggestions={suggestions}
                onSelectQuestion={(q) => handleSendMessage(q)}
              />
            </div>
          )}

          {/* Messages Rendering */}
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Dock */}
        <div className="p-4 sm:px-8 max-w-4xl w-full mx-auto border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          {messages.length > 0 && !isLoading && (
            <div className="mb-2">
              <SuggestedQuestions
                suggestions={suggestions.slice(0, 3)}
                onSelectQuestion={(q) => handleSendMessage(q)}
              />
            </div>
          )}

          <ChatInput
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </div>

      </main>
    </div>
  );
};

export default Chat;
