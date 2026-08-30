import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Database,
  FileCheck2,
  Cpu,
  ArrowRight,
  Search,
  BookOpen,
  HelpCircle,
  CheckCircle,
  Building,
  Key
} from 'lucide-react';

export const Home = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  const sampleQuestions = [
    "What is the annual tuition fee and hostel charges for first-year B.Tech?",
    "What is the minimum attendance required to appear in final semester exams?",
    "Can placed students sit for Super Dream placement drives?",
    "What are the hostel night curfew timings and dining mess charges?",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-brand-500 selection:text-white">
      
      {/* Hero Section */}
      <section className="relative pt-20 pb-24 overflow-hidden">
        {/* Background glow meshes */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-[400px] h-[250px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Generation Retrieval-Augmented Generation (RAG)</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Official Campus Information,{' '}
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Directly Grounded in Institutional Docs
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Eliminate speculation and guesswork. CollegeAI combines high-dimensional vector embeddings with strict anti-hallucination guardrails to answer student queries with verified document and page citations.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {isAuthenticated ? (
              <Link
                to="/chat"
                className="px-6 py-3.5 rounded-xl font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-500/25 transition-all flex items-center gap-2"
              >
                <span>Open Chat Assistant</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-6 py-3.5 rounded-xl font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-500/25 transition-all flex items-center gap-2"
                >
                  <span>Student Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-3.5 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="px-6 py-3.5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/25 transition-all"
              >
                Admin Control Portal
              </Link>
            )}
          </div>

          {/* Demo Login Tip Banner */}
          <div className="max-w-lg mx-auto p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2 shadow-inner">
            <Key className="w-4 h-4 text-brand-400 flex-shrink-0" />
            <span>
              Preloaded Demo Admin: <strong className="text-white">admin@college.edu</strong> (Password: <strong className="text-white">Admin@123</strong>)
            </span>
          </div>
        </div>
      </section>

      {/* RAG Architecture Flow */}
      <section className="py-16 bg-slate-900/50 border-y border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">The 100% Grounded RAG Pipeline</h2>
            <p className="text-xs text-slate-400">How CollegeAI prevents hallucinations and guarantees traceable answers</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">1. Ingestion & Page Tracking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Institutional PDFs, DOCX, and guidelines are cleaned and split into token chunks while preserving exact page numbers.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">2. Vector Search (ChromaDB)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Queries are embedded into numerical vectors to retrieve the Top-K authoritative document passages via cosine similarity.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">3. Multi-Model LLM Guardrails</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Google Gemini / OpenAI processes only the retrieved context with strict anti-fabrication prompts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">4. Citations & Refusals</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Answers display verifiable document and page source cards, safely refusing questions outside the knowledge base.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Sample Questions Exploration */}
      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        <h2 className="text-2xl font-bold text-white tracking-tight">Try Asking Questions Like</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          {sampleQuestions.map((q, idx) => (
            <Link
              key={idx}
              to={isAuthenticated ? "/chat" : "/login"}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-brand-500/40 hover:bg-slate-850 transition-all flex items-start gap-3 group"
            >
              <HelpCircle className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-slate-300 group-hover:text-white font-medium">{q}</span>
            </Link>
          ))}
        </div>
      </section>

    </div>
  );
};

export default Home;
