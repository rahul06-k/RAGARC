import React, { useState } from 'react';
import { FileText, Eye, CheckCircle, ChevronRight } from 'lucide-react';
import SourceModal from './SourceModal';

export const SourceCard = ({ source }) => {
  const [modalOpen, setModalOpen] = useState(false);

  if (!source) return null;

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className="group relative flex flex-col p-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-brand-500/50 hover:bg-slate-850 cursor-pointer transition-all duration-200 shadow-sm"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-brand-500/15 flex items-center justify-center text-brand-400 flex-shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-brand-300 transition-colors">
              {source.document_title || source.filename}
            </span>
          </div>

          <span className="text-[11px] font-medium text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md flex-shrink-0">
            Page {source.page_number}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
          {source.excerpt}
        </p>

        <div className="flex items-center justify-between text-[10px] text-slate-500 mt-auto pt-1 border-t border-slate-800/80">
          <span className="flex items-center gap-1 text-emerald-400">
            <CheckCircle className="w-3 h-3" />
            {source.relevance_score ? `${Math.round(source.relevance_score * 100)}% match` : 'Verified Source'}
          </span>
          <span className="flex items-center gap-0.5 text-slate-400 group-hover:text-brand-400 transition-colors">
            Inspect <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>

      {modalOpen && <SourceModal source={source} onClose={() => setModalOpen(false)} />}
    </>
  );
};

export default SourceCard;
