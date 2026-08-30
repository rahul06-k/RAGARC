import React, { useState, useEffect } from 'react';
import { adminApi } from '../../services/api';
import { Users, Shield, User, RefreshCw, Calendar, MessageSquare, FileText, CheckCircle2 } from 'lucide-react';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleToggle = async (user) => {
    const nextRole = user.role === 'admin' ? 'student' : 'admin';
    setUpdatingId(user.id);
    try {
      await adminApi.updateUserRole(user.id, nextRole);
      loadUsers();
    } catch (err) {
      alert('Failed to update user role: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider">
              Access Control
            </span>
            <span className="text-xs text-slate-400">• {total} registered users</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            User Accounts & Role Management
          </h1>
          <p className="text-xs text-slate-400">
            View student activity, track conversations created, and grant administrator privileges.
          </p>
        </div>

        <button
          onClick={loadUsers}
          title="Refresh user list"
          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4">User</th>
              <th className="py-3.5 px-4">Role</th>
              <th className="py-3.5 px-4">Conversations</th>
              <th className="py-3.5 px-4">Uploaded Docs</th>
              <th className="py-3.5 px-4">Created Date</th>
              <th className="py-3.5 px-4 text-right">Role Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <LoadingSpinner text="Loading registered accounts..." />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-850/60 transition-colors">
                  
                  {/* User info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                        {u.name ? u.name[0].toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-semibold text-[11px] uppercase tracking-wider ${
                      u.role === 'admin'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                      {u.role}
                    </span>
                  </td>

                  {/* Chats */}
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-brand-400" />
                      <span>{u.chat_sessions_count} sessions</span>
                    </div>
                  </td>

                  {/* Uploads */}
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-400" />
                      <span>{u.documents_uploaded_count} docs</span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleRoleToggle(u)}
                      disabled={updatingId === u.id}
                      className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
                        u.role === 'admin'
                          ? 'bg-slate-800 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10'
                          : 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 border border-indigo-500/30'
                      }`}
                    >
                      {updatingId === u.id ? 'Updating...' : u.role === 'admin' ? 'Demote to Student' : 'Promote to Admin'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminUsers;
