'use client';

import { useCallback, useState } from 'react';

interface DropZoneProps {
  onFilesDrop: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  children: React.ReactNode;
}

export function DropZone({ onFilesDrop, accept = '*', maxFiles = 10, children }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).slice(0, maxFiles);
    onFilesDrop(files);
  }, [maxFiles, onFilesDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-3 border-dashed border-ink rounded-sm p-10 text-center transition bg-cream
        ${isDragOver
          ? 'bg-vermilion/15 shadow-offset-sm'
          : 'hover:bg-cream/70'
        }
      `}
      role="button"
      tabIndex={0}
      aria-label="Drop files here or click to upload"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          document.getElementById('file-input')?.click();
        }
      }}
    >
      {children}
    </div>
  );
}
