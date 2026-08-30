import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

export const TypingIndicator = () => {
  return (
    <div className="flex gap-3.5 my-4 animate-fade-in justify-start">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-md shadow-brand-500/20 animate-pulse">
        <Bot className="w-4 h-4" />
      </div>

      <div className="flex flex-col items-start max-w-[75%]">
        <div className="px-4 py-3 rounded-2xl bg-slate-900 border border-slate-800 rounded-bl-none flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-400 animate-spin" />
          <span className="text-xs font-medium text-slate-300">
            Searching college knowledge base & generating answer...
          </span>
          <div className="flex items-center gap-1 ml-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
