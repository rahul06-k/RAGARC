import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, documentApi } from '../../services/api';
import AnalyticsCards from '../../components/Analytics/AnalyticsCards';
import DocumentUploadModal from '../../components/DocumentUpload/DocumentUploadModal';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Users,
  BarChart3,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity
} from 'lucide-react';

export const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider">
              Admin Portal
            </span>
            <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
              <Activity className="w-3.5 h-3.5" />
              RAG Ingestion Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Campus Knowledge Base Dashboard
          </h1>
          <p className="text-xs text-slate-400">
            Manage institutional documents, monitor semantic vector search, and track student query feedback.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setUploadOpen(true)}
            className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-lg shadow-brand-500/25 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          <Link
            to="/admin/documents"
            className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>Manage Docs</span>
          </Link>
        </div>
      </div>

      {/* Metrics Section */}
      {loading ? (
        <div className="py-16 text-center">
          <LoadingSpinner text="Aggregating RAG and user analytics..." />
        </div>
      ) : (
        <AnalyticsCards analytics={analytics} />
      )}

      {/* Quick Action Navigation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <Link
          to="/admin/documents"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/40 hover:bg-slate-850 transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Document Management</div>
              <div className="text-xs text-slate-400">Upload, filter, re-index docs</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/analytics"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-850 transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">RAG Metrics & Latency</div>
              <div className="text-xs text-slate-400">Retrieval precision & feedback</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          to="/admin/users"
          className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-850 transition-all flex items-center justify-between group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">User Administration</div>
              <div className="text-xs text-slate-400">Manage student & admin roles</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <DocumentUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={() => loadDashboardData()}
      />
    </div>
  );
};

export default AdminDashboard;
