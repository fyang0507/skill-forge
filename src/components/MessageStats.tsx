'use client';

import { MessageStats as MessageStatsType } from '@/hooks/useForgeChat';

interface MessageStatsProps {
  stats: MessageStatsType | undefined;
}

export function MessageStats({ stats }: MessageStatsProps) {
  if (!stats) return null;

  return (
    <div className="mt-2 pt-2 border-t border-zinc-700/50">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
        <span>In: {stats.promptTokens?.toLocaleString() ?? '-'}</span>
        {stats.cachedTokens ? <span>Cached: {stats.cachedTokens.toLocaleString()}</span> : null}
        <span>Out: {stats.completionTokens?.toLocaleString() ?? '-'}</span>
        <span>Time: {stats.executionTimeMs ? `${(stats.executionTimeMs / 1000).toFixed(1)}s` : '-'}</span>
      </div>
      {stats.reasoningTokens ? (
        <div className="text-xs text-zinc-500 mt-1">
          Reasoning: {stats.reasoningTokens.toLocaleString()} tokens
        </div>
      ) : null}
    </div>
  );
}
