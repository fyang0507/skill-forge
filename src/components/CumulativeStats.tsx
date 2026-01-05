'use client';

import { CumulativeStats } from '@/hooks/useForgeChat';

interface CumulativeStatsBarProps {
  stats: CumulativeStats;
}

export function CumulativeStatsBar({ stats }: CumulativeStatsBarProps) {
  if (stats.messageCount === 0) return null;

  const cacheRatio = stats.totalPromptTokens > 0
    ? ((stats.totalCachedTokens / stats.totalPromptTokens) * 100).toFixed(0)
    : 0;

  return (
    <div className="px-6 py-2 bg-zinc-900 border-t border-zinc-800">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-6 text-xs text-zinc-500">
        <span>Total In: {stats.totalPromptTokens.toLocaleString()}</span>
        <span>Cached: {stats.totalCachedTokens.toLocaleString()} ({cacheRatio}%)</span>
        <span>Total Out: {stats.totalCompletionTokens.toLocaleString()}</span>
        {stats.totalReasoningTokens > 0 && (
          <span>Reasoning: {stats.totalReasoningTokens.toLocaleString()}</span>
        )}
        <span>Time: {(stats.totalExecutionTimeMs / 1000).toFixed(1)}s</span>
        <span className="text-zinc-600">|</span>
        <span>{stats.messageCount} response{stats.messageCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}
