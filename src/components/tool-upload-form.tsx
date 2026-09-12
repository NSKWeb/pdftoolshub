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

    if (files.length > 0 && validFiles.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one supported file. Only PDF, PNG, and JPG are allowed.' });
    } else if (validFiles.length !== files.length) {
      setStatus({ type: 'error', message: 'Some files were skipped. Only PDF, PNG, and JPG files are allowed.' });
    } else if (validFiles.length > 0) {
      setStatus(null);
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
    <form onSubmit={handleSubmit} className="neo-card rounded-sm p-6 space-y-4">
      <DropZone onFilesDrop={handleFilesDrop} accept="application/pdf,image/png,image/jpeg">
        <div className="space-y-2">
          <div className="mx-auto w-14 h-14 border-2 border-ink bg-paper flex items-center justify-center">
            <svg className="w-7 h-7 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-inksoft">
            <span className="font-display font-bold text-ink">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-phantom">PDF, PNG, JPG up to 25MB</p>
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
          <p className="text-sm font-display font-bold text-ink" id="selected-files-label">Selected files:</p>
          <ul className="text-xs text-inksoft space-y-1" aria-labelledby="selected-files-label">
            {selectedFiles.map((file, idx) => (
              <li key={idx} className="flex items-center gap-2 border border-ink bg-paper px-2 py-1">
                <svg className="w-4 h-4 text-vermilion" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label htmlFor="instructions" className="block text-sm font-display font-bold text-ink">
          Optional instructions
        </label>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
          className="neo-input mt-2 !shadow-offset-sm rounded-sm"
          placeholder="e.g. rotate pages 2-4 by 90 degrees"
          aria-describedby="instructions-help"
        />
        <p id="instructions-help" className="text-xs text-phantom mt-1">
          For specific page operations, use format: page=start-end (e.g., page=1-5)
        </p>
      </div>

      {loading && (
        <div role="status" aria-live="polite" aria-label="Processing progress">
          <div className="w-full border-2 border-ink h-3 overflow-hidden bg-paper">
            <div
              className="bg-vermilion h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              role="progressbar"
            />
          </div>
          <p className="text-xs text-phantom mt-1 text-center">{progress}% complete</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || selectedFiles.length === 0}
        className="neo-btn neo-btn-accent w-full rounded-sm"
        aria-busy={loading}
      >
        {loading ? (
          <>
            <span className="w-4 h-4 border-2 border-cream border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            <span>Processing...</span>
          </>
        ) : (
          'Run tool'
        )}
      </button>

      {status && (
        <div
          className={`text-sm p-3 font-medium border-2 border-ink shadow-offset-sm ${
            status.type === 'success' ? 'bg-olive/15 text-olive' :
            status.type === 'error' ? 'bg-vermilion/10 text-vermilion' :
            'bg-paper text-inksoft'
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
          className="block w-full text-center text-sm font-display font-bold text-cream bg-ink border-2 border-ink py-2.5 hover:bg-vermilion transition shadow-offset-sm"
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
