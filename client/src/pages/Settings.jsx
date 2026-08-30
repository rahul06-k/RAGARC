import React from 'react';
import { Sliders, Moon, Bell, Shield, Database } from 'lucide-react';

export const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Preferences</h1>
        <p className="text-xs text-slate-400">Configure appearance, notification preferences, and retrieval settings</p>
      </div>

      <div className="space-y-4">
        
        {/* Appearance */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Moon className="w-4 h-4 text-brand-400" />
            <span>Theme & Display</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="font-semibold text-white">Dark Aesthetic (Default)</div>
              <div className="text-slate-400">Optimized high-contrast slate theme for academic portals</div>
            </div>
            <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 font-semibold">
              Enabled
            </span>
          </div>
        </div>

        {/* RAG Engine Info */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>RAG Engine Runtime Configuration</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Vector Storage Engine</span>
              <span className="font-semibold text-white font-mono">ChromaDB Persistent (HNSW Cosine)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Default Embedding Dimensions</span>
              <span className="font-semibold text-white font-mono">384 Dimensions (all-MiniLM-L6-v2)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400">Anti-Hallucination Grounding</span>
              <span className="font-semibold text-emerald-400">Strict Enforcement</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
