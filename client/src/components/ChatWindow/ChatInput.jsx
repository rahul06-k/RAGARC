import React, { useState, useRef, useEffect } from 'react';
import { Send, Filter, Sparkles, Layers } from 'lucide-react';

export const ChatInput = ({ onSendMessage, isLoading, categories = [], departments = [] }) => {
  const [input, setInput] = useState('');
  const [category, setCategory] = useState('All');
  const [department, setDepartment] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim(), category === 'All' ? null : category, department === 'All' ? null : department);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full space-y-2">
      {/* Optional Metadata Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs animate-slide-up">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            <span className="font-semibold">Retrieval Filter:</span>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400">Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Categories</option>
              <option value="Admissions">Admissions</option>
              <option value="Hostel">Hostel</option>
              <option value="Academics">Academics</option>
              <option value="Placement">Placement</option>
              <option value="Examination">Examination</option>
              <option value="Fees">Fees</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-slate-400">Department:</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="All">All Departments</option>
              <option value="Admissions Cell">Admissions Cell</option>
              <option value="Student Welfare">Student Welfare</option>
              <option value="Examination Branch">Examination Branch</option>
              <option value="Training & Placement Cell">Training & Placement Cell</option>
              <option value="Computer Science">Computer Science</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Input Form */}
      <form
        onSubmit={handleSubmit}
        className="relative flex items-end gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-brand-500/50 focus-within:ring-1 focus-within:ring-brand-500/20 transition-all shadow-lg"
      >
        {/* Toggle Filter Button */}
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          title="Toggle Retrieval Filter"
          className={`p-2.5 rounded-xl transition-colors flex-shrink-0 ${
            showFilters || category !== 'All' || department !== 'All'
              ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Filter className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about admissions, fees, hostel rules, courses, placements..."
          rows={1}
          disabled={isLoading}
          className="w-full resize-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none py-2 px-1 max-h-36 overflow-y-auto leading-relaxed"
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`p-2.5 rounded-xl flex-shrink-0 transition-all flex items-center justify-center ${
            input.trim() && !isLoading
              ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-md shadow-brand-500/30 scale-100'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-2">
        <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">Shift+Enter</kbd> for newline</span>
        <span>Grounded strictly against official documents</span>
      </div>
    </div>
  );
};

export default ChatInput;
