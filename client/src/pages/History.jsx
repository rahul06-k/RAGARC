import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../services/api';
import { MessageSquare, Trash2, Search, Calendar, ChevronRight, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/Loading/LoadingSpinner';

export const History = () => {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await chatApi.getSessions();
      setSessions(res.data || []);
    } catch (err) {
      setError('Failed to retrieve conversation history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await chatApi.deleteSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert('Failed to delete conversation.');
    }
  };

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Conversation History</h1>
          <p className="text-xs text-slate-400">Review, resume, or delete your previous campus assistant discussions</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search past conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* History List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center">
            <LoadingSpinner text="Retrieving conversation logs..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No Conversations Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You haven't initiated any questions matching your query.
            </p>
          </div>
        ) : (
          filtered.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(`/chat?session=${s.id}`)}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-brand-500/40 hover:bg-slate-850 cursor-pointer transition-all flex items-center justify-between group shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                    {s.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{s.message_count} {s.message_count === 1 ? 'message' : 'messages'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDelete(e, s.id)}
                  title="Delete conversation"
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default History;
