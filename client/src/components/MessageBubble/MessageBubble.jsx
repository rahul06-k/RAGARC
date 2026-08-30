import React, { useState } from 'react';
import { Bot, User, ThumbsUp, ThumbsDown, Clock, ShieldAlert, CheckCircle2, Copy, Check } from 'lucide-react';
import SourceCard from '../SourceCard/SourceCard';
import { chatApi } from '../../services/api';

export const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const [feedbackGiven, setFeedbackGiven] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFeedback = async (rating) => {
    if (feedbackGiven !== null) return;
    try {
      await chatApi.submitFeedback(message.id, rating);
      setFeedbackGiven(rating);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3.5 my-4 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/* Assistant Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-brand-500/20">
          <Bot className="w-4 h-4" />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        
        {/* Main Text Content */}
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
            isUser
              ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-br-none'
              : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none prose-chat'
          }`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>

        {/* Assistant Metadata & Grounding Badges */}
        {!isUser && (
          <div className="w-full mt-2 space-y-2">
            
            {/* Meta Row: Latency & Grounding Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                {message.is_grounded ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified RAG Grounded
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                    <ShieldAlert className="w-3 h-3" />
                    General Refusal / No Documents Found
                  </span>
                )}

                {message.latency ? (
                  <span className="inline-flex items-center gap-1 text-slate-400">
                    <Clock className="w-3 h-3" />
                    {message.latency}s
                  </span>
                ) : null}

                {message.model && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">
                    {message.model}
                  </span>
                )}
              </div>

              {/* Action Buttons: Copy & Thumbs Feedback */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  title="Copy response"
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleFeedback(1)}
                  title="Helpful answer"
                  className={`p-1 rounded transition-colors ${
                    feedbackGiven === 1
                      ? 'text-emerald-400 bg-emerald-500/10'
                      : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleFeedback(-1)}
                  title="Not helpful"
                  className={`p-1 rounded transition-colors ${
                    feedbackGiven === -1
                      ? 'text-rose-400 bg-rose-500/10'
                      : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Source Reference Cards Grid */}
            {message.sources && message.sources.length > 0 && (
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Retrieved College Sources ({message.sources.length}):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {message.sources.map((src, index) => (
                    <SourceCard key={index} source={src} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
