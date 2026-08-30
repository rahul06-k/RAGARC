import React from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Users,
  MessageSquare,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Layers,
  HelpCircle,
  BarChart2
} from 'lucide-react';

export const AnalyticsCards = ({ analytics }) => {
  if (!analytics) return null;

  const cards = [
    {
      title: 'Total Documents',
      value: analytics.total_documents,
      icon: FileText,
      color: 'text-brand-400',
      bg: 'bg-brand-500/10 border-brand-500/20',
      subtitle: `${analytics.processed_documents} active in RAG`,
    },
    {
      title: 'Processed & Indexed',
      value: analytics.processed_documents,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      subtitle: `${analytics.failed_documents} failed`,
    },
    {
      title: 'Registered Users',
      value: analytics.total_users,
      icon: Users,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      subtitle: 'Students & Admins',
    },
    {
      title: 'Student Questions',
      value: analytics.total_questions,
      icon: MessageSquare,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      subtitle: `${analytics.total_sessions} conversations`,
    },
    {
      title: 'Avg. Latency',
      value: `${analytics.avg_response_time_ms} ms`,
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      subtitle: 'Retrieval + LLM generation',
    },
    {
      title: 'Student Feedback',
      value: `${analytics.feedback_stats?.positive || 0} / ${(analytics.feedback_stats?.positive || 0) + (analytics.feedback_stats?.negative || 0)}`,
      icon: ThumbsUp,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
      subtitle: `${analytics.feedback_stats?.negative || 0} negative ratings`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md hover:border-slate-700 transition-all flex items-center justify-between"
            >
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {card.title}
                </span>
                <div className="text-2xl font-bold text-white mt-1">
                  {card.value}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {card.subtitle}
                </div>
              </div>

              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${card.bg} ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Breakdown & Popular Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Breakdown */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-brand-400" />
            <h3 className="text-sm font-semibold text-white">Knowledge Base by Category</h3>
          </div>

          <div className="space-y-3">
            {analytics.category_distribution?.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No categories indexed yet.</div>
            ) : (
              analytics.category_distribution.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">{cat.count} documents</span>
                    <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{
                          width: `${Math.min(100, (cat.count / (analytics.total_documents || 1)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular & Unanswered Queries */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">Frequently Asked Student Topics</h3>
          </div>

          <div className="space-y-3">
            {analytics.popular_queries?.length === 0 ? (
              <div className="text-xs text-slate-500 py-4 text-center">No student queries logged yet.</div>
            ) : (
              analytics.popular_queries.map((q, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-200 font-medium truncate max-w-xs">{q.query}</span>
                  <span className="px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 font-semibold text-[11px]">
                    {q.count} {q.count === 1 ? 'time' : 'times'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCards;
