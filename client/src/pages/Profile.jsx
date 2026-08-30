import React from 'react';
import { useAuth } from '../store/AuthContext';
import { User, Mail, Shield, Calendar, Key, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Account Profile</h1>
        <p className="text-xs text-slate-400">Manage your credentials, role privileges, and security settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* User Card */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-xl shadow-brand-500/20">
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </div>

          <div>
            <h2 className="text-base font-bold text-white">{user?.name}</h2>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
            isAdmin
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {user?.role} Role
          </span>

          <button
            onClick={handleLogout}
            className="w-full mt-4 py-2.5 px-4 rounded-xl bg-slate-950 border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>

        {/* Security & Access Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-400" />
              Role & Permissions
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Assigned Privilege Tier</span>
                <span className="font-semibold text-white uppercase">{user?.role}</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">RAG Document Ingestion</span>
                <span className={`font-semibold ${isAdmin ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isAdmin ? 'Granted (Admin)' : 'Restricted (Read-Only)'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Admin Control Portal</span>
                <span className={`font-semibold ${isAdmin ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {isAdmin ? 'Full Access' : 'No Access'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-slate-400">Account Created</span>
                <span className="text-slate-300 font-mono">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              Security Status
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your session is protected with JWT HMAC-SHA256 signature verification. Passwords are encrypted using salted bcrypt hashing algorithms.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 pt-1">
              <CheckCircle className="w-4 h-4" />
              <span>JWT Authentication Active</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
