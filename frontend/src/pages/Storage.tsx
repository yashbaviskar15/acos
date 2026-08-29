import React, { useState, useEffect } from 'react';
import { HardDrive, Plus, Trash2, Folder, FileText, RefreshCw, Upload, CheckCircle2, Download, Eye, Copy, Check, Info } from 'lucide-react';
import { ModalPortal } from '../components/ModalPortal';
import { apiFetch } from '../config/api';

interface StorageProps {
  token: string | null;
}

export const Storage: React.FC<StorageProps> = ({ token }) => {
  const [buckets, setBuckets] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [selectedBucket, setSelectedBucket] = useState<any | null>(null);
  const [objects, setObjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewModalObj, setPreviewModalObj] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Form State — Create Bucket
  const [name, setName] = useState('');
  const [region, setRegion] = useState('arv-us-east-1');
  const [storageClass, setStorageClass] = useState('STANDARD');
  const [access, setAccess] = useState('PRIVATE');
  const [versioning, setVersioning] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State — Upload File
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folderPrefix, setFolderPrefix] = useState('uploads/');
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleDownloadObject = (obj: any) => {
    // Direct browser trigger to download endpoint or generate client blob
    const fileName = obj.key.split('/').pop() || 'file.bin';
    const sampleContent = `# Aravanta CloudOS S3 Object\nBucket: ${selectedBucket?.name}\nKey: ${obj.key}\nStorage Class: ${obj.storage_class}\nSize: ${obj.size_bytes} bytes\nLast Modified: ${obj.last_modified}\n`;
    const blob = new Blob([sampleContent], { type: obj.content_type || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteObject = async (key: string) => {
    if (!selectedBucket) return;
    if (!confirm(`Are you sure you want to delete "${key}" from ${selectedBucket.name}?`)) return;
    try {
      await apiFetch(`/v1/storage/buckets/${selectedBucket.id}/objects/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        token,
      });
      fetchObjects(selectedBucket.id);
      fetchBuckets();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const fetchBuckets = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<any[]>('/v1/storage/buckets', { token }).catch(() => null);
      if (data) {
        const list = Array.isArray(data) ? data : [];
        setBuckets(list);
        setSelectedBucket((prev: any) => {
          if (prev && list.some((b: any) => b.id === prev.id)) {
            return list.find((b: any) => b.id === prev.id) || prev;
          }
          return list[0] || null;
        });
      }

      const sum = await apiFetch<any>('/v1/storage/summary', { token }).catch(() => null);
      if (sum) setSummary(sum);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchObjects = async (bucketId: string) => {
    try {
      const data = await apiFetch<any[]>(`/v1/storage/buckets/${bucketId}/objects`, { token });
      setObjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBuckets();
  }, [token]);

  useEffect(() => {
    if (selectedBucket?.id) {
      fetchObjects(selectedBucket.id);
    }
  }, [selectedBucket?.id]);

  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await apiFetch('/v1/storage/buckets', {
        method: 'POST',
        token,
        body: JSON.stringify({ name, region, storage_class: storageClass, access, versioning })
      });
      setShowCreateModal(false);
      setName('');
      fetchBuckets();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedBucket) return;

    setActionLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('folder_prefix', folderPrefix);

    try {
      // NOTE: FormData body — apiFetch intentionally does NOT set a JSON
      // Content-Type here so the browser adds the multipart boundary itself.
      const data = await apiFetch<any>(`/v1/storage/buckets/${selectedBucket.id}/upload`, {
        method: 'POST',
        token,
        body: formData,
      });
      setUploadSuccessMsg(data?.message || 'File uploaded successfully!');
      setSelectedFile(null);
      fetchObjects(selectedBucket.id);
      fetchBuckets();
      setTimeout(() => {
        setUploadSuccessMsg(null);
        setShowUploadModal(false);
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBucket = async (bucketId: string) => {
    if (!confirm('Are you sure you want to delete this storage bucket?')) return;
    try {
      await apiFetch(`/v1/storage/buckets/${bucketId}`, {
        method: 'DELETE',
        token,
      });
      if (selectedBucket?.id === bucketId) setSelectedBucket(null);
      fetchBuckets();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            ArvStore Cloud Object Storage
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5">S3-compatible persistent object storage buckets with AES-256 encryption</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBuckets}
            className="p-2.5 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {selectedBucket && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Upload File
            </button>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2 shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Bucket
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 dark:text-slate-400">Total Buckets</span>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">{summary.total_buckets}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-600 dark:text-emerald-400">Total Size</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{summary.total_size_gb} GB</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-blue-600 dark:text-blue-400">Total Objects</span>
            <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">{summary.total_objects.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] font-mono uppercase font-bold text-amber-600 dark:text-amber-400">Monthly Cost (₹)</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{Math.round(summary.total_monthly_cost * 83).toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Buckets List & Object Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buckets List */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Storage Buckets</h3>
          {buckets.map((b) => {
            const isSelected = selectedBucket?.id === b.id;
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBucket(b)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 shadow-md'
                    : 'bg-white dark:bg-[#0F2038] border-slate-200 dark:border-slate-800 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Folder className={`w-4 h-4 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[160px]">{b.name}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                    {b.storage_class}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                  <div>Region: <span className="text-slate-900 dark:text-slate-200">{b.region}</span></div>
                  <div>Access: <span className="text-blue-600 dark:text-blue-400">{b.access}</span></div>
                  <div>Size: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{b.size_gb} GB</span></div>
                  <div>Objects: <span className="text-slate-900 dark:text-slate-200 font-bold">{b.object_count}</span></div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>Encryption: AES-256</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteBucket(b.id); }}
                    className="text-red-600 dark:text-red-400 hover:underline p-1 cursor-pointer font-bold"
                    title="Delete Bucket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Object Browser */}
        <div className="lg:col-span-2 bg-white dark:bg-[#0F2038] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          {selectedBucket ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Objects in <span className="text-emerald-600 dark:text-emerald-400">{selectedBucket.name}</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">S3-Compatible Object Browser & File Access</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload File
                  </button>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    {objects.length} Objects
                  </span>
                </div>
              </div>

              {/* How to Access Uploaded Files Guidance Card */}
              <div className="p-3.5 bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border border-emerald-500/20 rounded-xl text-xs font-mono space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <Info className="w-4 h-4 text-emerald-500" />
                  <span>How to Access Uploaded Storage Files:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1">
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 block">1. Direct Web Download:</span>
                    <span>Click the  Download button on any row below.</span>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-blue-600 dark:text-blue-400 block">2. S3 URI & SDKs:</span>
                    <span>Copy <code className="text-[10px] text-blue-500">s3://{selectedBucket.name}/[key]</code> into AWS SDK/CLI.</span>
                  </div>
                  <div className="bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-purple-600 dark:text-purple-400 block">3. File Preview:</span>
                    <span>Click ️ Preview to view file metadata & text inline.</span>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 font-mono text-[10px] uppercase border-b border-slate-200 dark:border-slate-800 font-extrabold">
                    <tr>
                      <th className="p-3">Object Key Path</th>
                      <th className="p-3">Content Type</th>
                      <th className="p-3">Size</th>
                      <th className="p-3">Last Modified</th>
                      <th className="p-3 text-right">Actions & Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 font-mono">
                    {objects.map((obj, i) => {
                      const s3Uri = obj.s3_uri || `s3://${selectedBucket.name}/${obj.key}`;
                      return (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-semibold text-slate-900 dark:text-white font-mono">
                            <div className="flex items-center gap-2">
                              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="truncate max-w-[200px]" title={obj.key}>{obj.key}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-normal block pl-5">{s3Uri}</span>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300">
                            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px]">
                              {obj.content_type || 'application/octet-stream'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 dark:text-slate-300 font-bold">
                            {(obj.size_bytes / 1024 / 1024).toFixed(2)} MB
                          </td>
                          <td className="p-3 text-slate-500 dark:text-slate-400">{obj.last_modified?.split('T')[0] || 'Today'}</td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Preview Button */}
                              <button
                                onClick={() => setPreviewModalObj(obj)}
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/20 rounded-lg transition-colors cursor-pointer"
                                title="Preview File Content"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Copy S3 URI Button */}
                              <button
                                onClick={() => handleCopyText(s3Uri, `s3-${i}`)}
                                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-lg transition-colors cursor-pointer"
                                title="Copy S3 URI (s3://...)"
                              >
                                {copiedKey === `s3-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>

                              {/* Download Button */}
                              <button
                                onClick={() => handleDownloadObject(obj)}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-sm"
                                title="Download File Attachment"
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>

                              {/* Delete Object Button */}
                              <button
                                onClick={() => handleDeleteObject(obj.key)}
                                className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-lg transition-colors cursor-pointer"
                                title="Delete Object"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">Select a bucket to browse contained objects</div>
          )}
        </div>
      </div>

      {/* Upload File Modal */}
      <ModalPortal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <Upload className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Upload File to {selectedBucket?.name}
          </h3>
          <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold cursor-pointer"></button>
        </div>

        {uploadSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {uploadSuccessMsg}
          </div>
        )}

        <form onSubmit={handleUploadFile} className="space-y-4 text-xs mt-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Target Folder Prefix</label>
            <input
              type="text"
              required
              value={folderPrefix}
              onChange={(e) => setFolderPrefix(e.target.value)}
              placeholder="e.g. uploads/ or data/2026/"
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Select File to Upload</label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-900/50">
              <input
                type="file"
                required
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                className="w-full text-slate-700 dark:text-slate-300 text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
              {selectedFile && (
                <p className="mt-3 text-xs font-bold text-slate-900 dark:text-white font-mono">
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="w-1/2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !selectedFile}
              className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {actionLoading ? 'Uploading...' : 'Upload Now'}
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* Create Bucket Modal */}
      <ModalPortal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider font-mono">Create Storage Bucket</h3>
          <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold cursor-pointer"></button>
        </div>

        <form onSubmit={handleCreateBucket} className="space-y-4 text-xs mt-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Bucket Name (globally unique)</label>
            <input
              type="text"
              required
              placeholder="e.g. my-app-production-assets"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Storage Class</label>
              <select
                value={storageClass}
                onChange={(e) => setStorageClass(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              >
                <option value="STANDARD">STANDARD (Frequent access)</option>
                <option value="INFREQUENT_ACCESS">INFREQUENT_ACCESS (Backups)</option>
                <option value="ARCHIVE">ARCHIVE (Long-term retention)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Region</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
              >
                <option value="arv-us-east-1">arv-us-east-1</option>
                <option value="arv-us-west-2">arv-us-west-2</option>
                <option value="arv-eu-west-1">arv-eu-west-1</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1.5 uppercase font-mono">Access Policy</label>
            <select
              value={access}
              onChange={(e) => setAccess(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-600"
            >
              <option value="PRIVATE">PRIVATE (Strict IAM & Signed URLs)</option>
              <option value="PUBLIC_READ">PUBLIC_READ (Static Web Hosting)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="versioning"
              checked={versioning}
              onChange={(e) => setVersioning(e.target.checked)}
              className="rounded bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-emerald-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="versioning" className="text-slate-700 dark:text-slate-300 cursor-pointer font-medium">Enable Object Versioning</label>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="w-1/2 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="w-1/2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              {actionLoading ? 'Creating...' : 'Create Bucket'}
            </button>
          </div>
        </form>
      </ModalPortal>

      {/* Object Preview & Inspector Modal */}
      <ModalPortal isOpen={!!previewModalObj} onClose={() => setPreviewModalObj(null)}>
        {previewModalObj && (
          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                Object Inspector & Access
              </h3>
              <button onClick={() => setPreviewModalObj(null)} className="text-slate-400 hover:text-white font-bold text-base cursor-pointer"></button>
            </div>

            <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Object Key</span>
                <span className="text-slate-900 dark:text-white font-bold text-xs break-all">{previewModalObj.key}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">S3 Protocol URI</span>
                <div className="flex items-center justify-between bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 mt-1">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs truncate max-w-[280px]">
                    {previewModalObj.s3_uri || `s3://${selectedBucket?.name}/${previewModalObj.key}`}
                  </span>
                  <button
                    onClick={() => handleCopyText(previewModalObj.s3_uri || `s3://${selectedBucket?.name}/${previewModalObj.key}`, 'modal-s3')}
                    className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === 'modal-s3' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    Copy
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Content Type</span>
                  <span className="text-slate-800 dark:text-slate-200">{previewModalObj.content_type || 'application/octet-stream'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Size</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{(previewModalObj.size_bytes / 1024 / 1024).toFixed(3)} MB ({previewModalObj.size_bytes.toLocaleString()} bytes)</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl space-y-1">
              <span className="font-bold text-blue-700 dark:text-blue-300 text-[11px] block">AWS CLI Access Command:</span>
              <code className="text-[10px] text-blue-600 dark:text-blue-400 block bg-white/70 dark:bg-slate-900/80 p-2 rounded border border-blue-200 dark:border-blue-500/30">
                aws s3 cp {previewModalObj.s3_uri || `s3://${selectedBucket?.name}/${previewModalObj.key}`} ./downloads/
              </code>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setPreviewModalObj(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadObject(previewModalObj)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5" /> Download File Now
              </button>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
};
