import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import AnalyticsCards from '../../components/Analytics/AnalyticsCards';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import { BarChart3, RefreshCw, Layers, CheckCircle2, ShieldCheck } from 'lucide-react';

export const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider">
              System Insights
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            RAG Performance & Chat Analytics
          </h1>
          <p className="text-xs text-slate-400">
            Real-time evaluation of retrieval latency, student queries, knowledge base distribution, and feedback.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          title="Refresh analytics"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <LoadingSpinner text="Computing system metrics..." />
        </div>
      ) : (
        <AnalyticsCards analytics={analytics} />
      )}

    </div>
  );
};

export default AdminAnalytics;
