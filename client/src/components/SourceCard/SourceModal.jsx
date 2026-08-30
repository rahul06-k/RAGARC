import React from 'react';
import { X, FileText, ExternalLink, Bookmark, CheckCircle2 } from 'lucide-react';
import { documentApi } from '../../services/api';

export const SourceModal = ({ source, onClose }) => {
  if (!source) return null;

  const downloadUrl = documentApi.getSourceUrl(source.document_id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white truncate max-w-md">
                {source.document_title}
              </h3>
              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                <span>{source.filename}</span>
                <span>•</span>
                <span className="text-brand-400 font-medium">Page {source.page_number}</span>
                {source.category && (
                  <>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {source.category}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-brand-400" />
              Retrieved Grounding Excerpt
            </span>
            {source.relevance_score !== undefined && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Score: {Math.round(source.relevance_score * 100)}% Match
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-brand-500 selection:text-white">
            {source.excerpt}
          </div>

          <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/15 text-xs text-blue-300 flex items-start gap-2">
            <span className="text-base leading-none">💡</span>
            <span>
              This excerpt was retrieved by the semantic vector engine and provided to the LLM to verify and ground the answer.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open Full Original Document
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default SourceModal;
