import React, { useState, useEffect } from 'react';
import { FileText, Search, ExternalLink, Plus, CheckCircle2, ShieldCheck, Upload, AlertCircle } from 'lucide-react';
import { SourceDocument } from '../types';
import { api } from '../api';

export const EvidenceView: React.FC = () => {
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    publisher: '',
    url: '',
    source_type: 'factsheet',
    raw_excerpt: '',
    publication_date: new Date().toISOString().split('T')[0],
  });

  const loadEvidence = () => {
    setLoading(true);
    api.getEvidence()
      .then(res => setDocuments(res.documents))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadEvidence();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.uploadEvidence(newDoc);
      setShowUploadModal(false);
      loadEvidence();
    } catch (err: any) {
      console.error('Error uploading document:', err);
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.publisher.toLowerCase().includes(search.toLowerCase()) ||
    d.source_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <section
        aria-label="Evidence Explorer Header"
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#051a0d] border border-[#093017] shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#093017] border border-[#2CA757]/30 text-[#74D885]">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Evidence Explorer & Provenance Repository</h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Inspect original regulatory filings, audited factsheets, and sustainability disclosures supporting screening findings.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2CA757] hover:bg-[#258c49] text-[#093017] text-xs font-bold cursor-pointer transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Evidence Record</span>
        </button>
      </section>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by document title, publisher, or filing type..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-[#051a0d] border border-[#093017] focus:border-[#2CA757] rounded-xl text-xs text-white placeholder-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2CA757]"
        />
      </div>

      {/* Documents Grid */}
      <section aria-label="Evidence Documents List" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => (
          <div key={doc.id} className="p-4 rounded-xl bg-[#051a0d] border border-[#093017] space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded uppercase tracking-wider bg-[#04140a] border border-[#093017] text-[#74D885]">
                  {doc.source_type}
                </span>
                <span className="flex items-center gap-1 text-[10px] text-[#2CA757] font-mono">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>VERIFIED RECORD</span>
                </span>
              </div>

              <h2 className="font-bold text-white text-xs mt-2">{doc.title}</h2>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Publisher: <span className="text-slate-300 font-medium">{doc.publisher}</span> · Published: <span className="font-mono text-slate-300">{doc.publication_date}</span>
              </div>

              {doc.raw_excerpt && (
                <div className="mt-2.5 p-2.5 bg-[#04140a] rounded-lg border border-[#093017] text-[11px] text-slate-300 leading-relaxed font-sans">
                  "{doc.raw_excerpt}"
                </div>
              )}
            </div>

            <div className="pt-2.5 border-t border-[#093017] flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-mono text-[10px]">
                Retrieval: {doc.retrieval_date}
              </span>
              {doc.url ? (
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-[#74D885] hover:text-[#D3FCDA] font-medium transition-colors"
                >
                  <span>Official Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span className="text-slate-500 text-[10px]">Internal Archival Document</span>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#051a0d] border border-[#093017] rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#74D885]" />
              <span>Register New Source Evidence Record</span>
            </h2>

            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ørsted Annual Report 2026"
                  value={newDoc.title}
                  onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#04140a] border border-[#093017] rounded-lg text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Publisher / Issuer</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ørsted A/S"
                  value={newDoc.publisher}
                  onChange={e => setNewDoc({ ...newDoc, publisher: e.target.value })}
                  className="w-full px-3 py-2 bg-[#04140a] border border-[#093017] rounded-lg text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Official Document URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newDoc.url}
                  onChange={e => setNewDoc({ ...newDoc, url: e.target.value })}
                  className="w-full px-3 py-2 bg-[#04140a] border border-[#093017] rounded-lg text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Raw Excerpt / Key Audit Quote</label>
                <textarea
                  rows={3}
                  placeholder="Direct citation from filing establishing compliance or breach..."
                  value={newDoc.raw_excerpt}
                  onChange={e => setNewDoc({ ...newDoc, raw_excerpt: e.target.value })}
                  className="w-full px-3 py-2 bg-[#04140a] border border-[#093017] rounded-lg text-white text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#072411] text-slate-300 font-medium hover:bg-[#093017] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#2CA757] hover:bg-[#258c49] text-[#093017] font-bold cursor-pointer"
                >
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
