import React from 'react';
import { GraduationCap, ShieldCheck, Cpu, Database } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/60 py-8 mt-auto text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-slate-400">CollegeAI Information Assistant</span>
          <span>•</span>
          <span>Enterprise RAG Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>ChromaDB Vector Store</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-brand-400" />
            <span>Multi-Model Grounded LLM</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>Anti-Hallucination Guardrails</span>
          </div>
        </div>

        <div>
          &copy; {new Date().getFullYear()} National Institute of Engineering & Technology.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
