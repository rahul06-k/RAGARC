import React, { useState } from 'react';
import {
  FileText,
  RefreshCw,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Eye,
  Power,
  Layers
} from 'lucide-react';
import { documentApi } from '../../services/api';
import LoadingSpinner from '../Loading/LoadingSpinner';

export const DocumentTable = ({ documents = [], isLoading, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [processingDocId, setProcessingDocId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleReprocess = async (docId) => {
    setProcessingDocId(docId);
    try {
      await documentApi.reprocessDocument(docId);
      onRefresh();
    } catch (err) {
      alert('Failed to reprocess: ' + (err.response?.data?.detail || err.message));
    } finally {
      setProcessingDocId(null);
    }
  };

  const handleToggleStatus = async (doc) => {
    const nextStatus = doc.status === 'active' ? 'inactive' : 'active';
    try {
      await documentApi.updateDocument(doc.id, { status: nextStatus });
      onRefresh();
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async (docId) => {
    try {
      await documentApi.deleteDocument(docId);
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err) {
      alert('Failed to delete document: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Filter documents in memory
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.filename.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || doc.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status, errorMsg) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            PROCESSING
          </span>
        );
      case 'FAILED':
        return (
          <span
            title={errorMsg || 'Processing failed'}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-help"
          >
            <AlertTriangle className="w-3 h-3" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            {status || 'PENDING'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls: Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by title or file..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="All">All Categories</option>
            <option value="Admissions">Admissions</option>
            <option value="Hostel">Hostel</option>
            <option value="Academics">Academics</option>
            <option value="Placement">Placement</option>
            <option value="Examination">Examination</option>
            <option value="Fees">Fees</option>
            <option value="General">General</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-500"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active in RAG</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-4">Document Title & Filename</th>
              <th className="py-3.5 px-4">Category & Department</th>
              <th className="py-3.5 px-4">Version</th>
              <th className="py-3.5 px-4">Pages / Size</th>
              <th className="py-3.5 px-4">RAG Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center">
                  <LoadingSpinner text="Loading college knowledge base..." />
                </td>
              </tr>
            ) : filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No documents found matching the filter criteria.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-850/60 transition-colors group">
                  
                  {/* Title & File */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate max-w-xs">{doc.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{doc.filename}</div>
                      </div>
                    </div>
                  </td>

                  {/* Category & Dept */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium text-slate-200">{doc.category}</span>
                      <span className="text-[11px] text-slate-400">{doc.department}</span>
                    </div>
                  </td>

                  {/* Version */}
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[11px] text-slate-300">
                      v{doc.version}
                    </span>
                  </td>

                  {/* Pages & Size */}
                  <td className="py-3.5 px-4 text-slate-300">
                    <div>{doc.page_count} {doc.page_count === 1 ? 'page' : 'pages'}</div>
                    <div className="text-[10px] text-slate-400">
                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(0)} KB` : '-'}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col items-start gap-1">
                      {getStatusBadge(doc.processing_status, doc.error_message)}
                      <span className={`text-[10px] uppercase font-bold tracking-wider ${
                        doc.status === 'active' ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        • {doc.status}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* View Source */}
                      <a
                        href={documentApi.getSourceUrl(doc.id)}
                        target="_blank"
                        rel="noreferrer"
                        title="View original file"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </a>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleStatus(doc)}
                        title={doc.status === 'active' ? 'Deactivate from RAG' : 'Activate in RAG'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          doc.status === 'active'
                            ? 'text-emerald-400 hover:bg-emerald-500/10'
                            : 'text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Reprocess */}
                      <button
                        onClick={() => handleReprocess(doc.id)}
                        disabled={processingDocId === doc.id}
                        title="Re-extract and Re-index into ChromaDB"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-800 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${processingDocId === doc.id ? 'animate-spin text-brand-400' : ''}`} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirmId(doc.id)}
                        title="Delete Document and Vector Embeddings"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl animate-slide-up space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Document?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete this document? This will remove the raw file, its relational records, and all corresponding ChromaDB vector embeddings.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors shadow-md shadow-rose-500/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentTable;
