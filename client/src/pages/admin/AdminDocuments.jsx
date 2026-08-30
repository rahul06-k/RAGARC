import React, { useState, useEffect } from 'react';
import { documentApi } from '../../services/api';
import DocumentTable from '../../components/DocumentTable/DocumentTable';
import DocumentUploadModal from '../../components/DocumentUpload/DocumentUploadModal';
import { FileText, Upload, RefreshCw, Layers } from 'lucide-react';

export const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentApi.getDocuments({ limit: 100 });
      setDocuments(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[11px] font-bold uppercase tracking-wider">
              Knowledge Base
            </span>
            <span className="text-xs text-slate-400">• {total} total uploaded</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            College Document Ingestion & Repository
          </h1>
          <p className="text-xs text-slate-400">
            Upload official PDF, DOCX, and TXT documents. Documents are automatically chunked, embedded, and indexed in ChromaDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadDocuments}
            title="Refresh list"
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setUploadOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs transition-all shadow-md shadow-brand-500/20 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DocumentTable
        documents={documents}
        isLoading={loading}
        onRefresh={loadDocuments}
      />

      <DocumentUploadModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploadSuccess={loadDocuments}
      />

    </div>
  );
};

export default AdminDocuments;
