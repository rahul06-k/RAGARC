import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { documentApi } from '../../services/api';
import LoadingSpinner from '../Loading/LoadingSpinner';

export const DocumentUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Admissions');
  const [department, setDepartment] = useState('All');
  const [version, setVersion] = useState('1.0');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile) => {
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) {
      setError('Only PDF, DOCX, and TXT files are supported.');
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size must be under 25MB.');
      return;
    }
    setError(null);
    setFile(selectedFile);
    if (!title) {
      const cleanTitle = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_|-]/g, ' ');
      setTitle(cleanTitle);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a document to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please provide a title for the document.');
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('category', category);
    formData.append('department', department);
    formData.append('version', version);

    try {
      await documentApi.uploadDocument(formData);
      onUploadSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload and ingest document.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Upload College Document</h3>
              <p className="text-xs text-slate-400">Add official institutional PDFs, DOCX, or TXT for RAG indexing</p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-brand-500 bg-brand-500/10'
                : file
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => e.target.files && handleSelectedFile(e.target.files[0])}
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <span className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</span>
                <span className="text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-slate-500" />
                <span className="text-sm font-medium text-slate-300">
                  Drag & drop your document here, or <span className="text-brand-400">browse</span>
                </span>
                <span className="text-xs text-slate-500">Supports PDF, DOCX, TXT up to 25MB</span>
              </div>
            )}
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Document Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. B.Tech Admissions & Fee Structure 2026"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-brand-500 placeholder:text-slate-600"
            />
          </div>

          {/* Grid: Category, Department, Version */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="Admissions">Admissions</option>
                <option value="Hostel">Hostel</option>
                <option value="Academics">Academics</option>
                <option value="Placement">Placement</option>
                <option value="Examination">Examination</option>
                <option value="Fees">Fees</option>
                <option value="Policies">Policies</option>
                <option value="General">General</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              >
                <option value="All">All Departments</option>
                <option value="Admissions Cell">Admissions Cell</option>
                <option value="Student Welfare">Student Welfare</option>
                <option value="Examination Branch">Examination Branch</option>
                <option value="Training & Placement Cell">T&P Cell</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Accounts Section">Accounts Section</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Version</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="1.0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-5 py-2.5 text-xs font-semibold bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl transition-all shadow-md shadow-brand-500/20 flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" text="" />
                  <span>Processing & Chunking...</span>
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload & Ingest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
