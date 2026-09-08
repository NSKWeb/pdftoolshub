'use client';

import { useState, useCallback } from 'react';
import { DropZone } from './drop-zone';

export function ToolUploadForm({ tool }: { tool: string }) {
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFilesDrop = useCallback((files: File[]) => {
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg'];
    const validFiles = files.filter(f => allowedTypes.includes(f.type));
    
    if (validFiles.length !== files.length) {
      setStatus({ type: 'error', message: 'Some files were skipped. Only PDF, PNG, and JPG files are allowed.' });
    }
    
    setSelectedFiles(validFiles);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFilesDrop(files);
  }, [handleFilesDrop]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedFiles.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one file.' });
      return;
    }

    setLoading(true);
    setStatus(null);
    setDownloadUrl(null);
    setProgress(10);

    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('files', file));
    const instructions = (event.currentTarget.elements.namedItem('instructions') as HTMLTextAreaElement)?.value;
    if (instructions) formData.append('instructions', instructions);

    try {
      const res = await fetch(`/api/tools/${tool}`, {
        method: 'POST',
        body: formData
      });

      setProgress(70);
      const data = await res.json();

      if (res.ok) {
        setStatus({ type: 'success', message: data.message ?? 'Processing complete.' });
        if (data.downloadUrl) setDownloadUrl(data.downloadUrl);
      } else {
        setStatus({ type: 'error', message: data.message ?? 'Processing failed.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
      setProgress(100);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="gradient-border rounded-xl bg-panel p-6 space-y-4">
      <DropZone onFilesDrop={handleFilesDrop} accept="application/pdf,image/png,image/jpeg">
        <div className="space-y-2">
          <svg className="w-12 h-12 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-slate-300">
            <span className="text-accent">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500">PDF, PNG, JPG up to 25MB</p>
        </div>
        <input
          id="file-input"
          name="files"
          type="file"
          multiple
          accept="application/pdf,image/png,image/jpeg"
          className="sr-only"
          onChange={handleFileInput}
          aria-label="File upload input"
        />
      </DropZone>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-300" id="selected-files-label">Selected files:</p>
          <ul className="text-xs text-slate-400 space-y-1" aria-labelledby="selected-files-label">
            {selectedFiles.map((file, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="instructions" className="block text-sm text-slate-300 font-medium">
          Optional instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
          className="mt-2 w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm focus:border-accent focus:outline-none transition focus:ring-2 focus:ring-accent/20"
          placeholder="e.g. rotate pages 2-4 by 90 degrees"
          aria-describedby="instructions-help"
        />
        <p id="instructions-help" className="text-xs text-slate-500 mt-1">
          For specific page operations, use format: page=start-end (e.g., page=1-5)
        </p>
      </div>

      {loading && (
        <div role="status" aria-live="polite" aria-label="Processing progress">
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-accent h-2 transition-all duration-300"
              style={{ width: `${progress}%` }}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <p className="text-xs text-slate-400 mt-1 text-center">{progress}% complete</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || selectedFiles.length === 0}
        className="w-full rounded-md bg-accent text-slate-900 font-medium py-2.5 disabled:opacity-60 hover:opacity-90 transition flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent/50"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <span>Processing...</span>
          </>
        ) : (
          'Run tool'
        )}
      </button>

      {status && (
        <div 
          className={`text-sm p-3 rounded-md ${
            status.type === 'success' ? 'text-green-400 bg-green-400/10' : 
            status.type === 'error' ? 'text-red-400 bg-red-400/10' : 
            'text-slate-300 bg-slate-700/50'
          }`}
          role={status.type === 'error' ? 'alert' : 'status'}
          aria-live="polite"
        >
          {status.message}
        </div>
      )}

      {downloadUrl && (
        <a
          href={downloadUrl}
          className="block w-full text-center text-sm text-accent bg-accent/10 rounded-md py-2.5 hover:bg-accent/20 transition font-medium focus:outline-none focus:ring-2 focus:ring-accent/50"
          target="_blank"
          rel="noopener noreferrer"
          download
        >
          Download processed file →
        </a>
      )}
    </form>
  );
}
