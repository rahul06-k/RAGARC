import React from 'react';
import { Sparkles, ArrowUpRight } from 'lucide-react';

export const SuggestedQuestions = ({ suggestions = [], onSelectQuestion }) => {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="space-y-2 py-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
        <span>Suggested Questions</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-brand-500/40 hover:bg-slate-800 transition-all text-left"
          >
            <span>{q}</span>
            <ArrowUpRight className="w-3 h-3 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
