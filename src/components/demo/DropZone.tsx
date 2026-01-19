'use client';

import { useState, useCallback } from 'react';

interface DropZoneProps {
  onDrop: (conversationId: string) => void;
  position: 'left' | 'right';
  accentColor: 'amber' | 'emerald';
  isEmpty: boolean;
  children?: React.ReactNode;
}

export function DropZone({
  onDrop,
  position,
  accentColor,
  isEmpty,
  children,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const conversationId = e.dataTransfer.getData('text/conversation-id');
    if (conversationId) {
      onDrop(conversationId);
    }
  }, [onDrop]);

  const colorClasses = {
    amber: {
      border: isDragOver ? 'border-amber-500' : 'border-amber-500/30',
      bg: isDragOver ? 'bg-amber-500/10' : 'bg-amber-500/5',
      text: 'text-amber-400',
      label: 'Run 1 (Learning)',
    },
    emerald: {
      border: isDragOver ? 'border-emerald-500' : 'border-emerald-500/30',
      bg: isDragOver ? 'bg-emerald-500/10' : 'bg-emerald-500/5',
      text: 'text-emerald-400',
      label: 'Run 2 (Efficiency)',
    },
  };

  const colors = colorClasses[accentColor];

  if (!isEmpty) {
    return (
      <div
        className={`flex flex-col h-full w-full min-w-0 max-w-full border-2 rounded-xl transition-colors overflow-hidden ${colors.border} ${colors.bg}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`flex-shrink-0 px-4 py-2 border-b border-zinc-800 ${colors.text} text-sm font-medium`}>
          {colors.label}
        </div>
        <div className="flex-1 w-full min-w-0 max-w-full overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center h-full border-2 border-dashed rounded-xl transition-all cursor-pointer ${colors.border} ${colors.bg}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid={`dropzone-${position}`}
    >
      <div className={`w-12 h-12 mb-4 rounded-full bg-zinc-800 flex items-center justify-center ${isDragOver ? 'scale-110' : ''} transition-transform`}>
        <svg
          className={`w-6 h-6 ${colors.text}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </div>
      <div className={`text-sm font-medium ${colors.text}`}>{colors.label}</div>
      <div className="text-xs text-zinc-500 mt-1">
        {isDragOver ? 'Drop to add' : 'Drag conversation here'}
      </div>
    </div>
  );
}
