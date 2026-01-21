'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ComparisonPane } from './ComparisonPane';
import { SkillsPane } from './SkillsPane';
import { MetricsBar, ConversationStats } from './MetricsBar';
import type { SkillMeta } from '@/hooks/useSkills';

interface DemoLayoutProps {
  leftConversationId: string | null;
  rightConversationId: string | null;
  onDropLeft: (id: string) => void;
  onDropRight: (id: string) => void;
  onClearLeft: () => void;
  onClearRight: () => void;
  skills: SkillMeta[];
  skillsLoading: boolean;
  onSelectSkill: (name: string) => void;
  onTitlesAvailable?: (leftTitle: string | null, rightTitle: string | null) => void;
}

export function DemoLayout({
  leftConversationId,
  rightConversationId,
  onDropLeft,
  onDropRight,
  onClearLeft,
  onClearRight,
  skills,
  skillsLoading,
  onSelectSkill,
  onTitlesAvailable,
}: DemoLayoutProps) {
  const [leftStats, setLeftStats] = useState<ConversationStats | null>(null);
  const [rightStats, setRightStats] = useState<ConversationStats | null>(null);
  const [leftTitle, setLeftTitle] = useState<string | null>(null);
  const [rightTitle, setRightTitle] = useState<string | null>(null);

  // Track previous values to avoid unnecessary callbacks
  const prevTitlesRef = useRef<{ left: string | null; right: string | null }>({ left: null, right: null });

  const handleLeftStats = useCallback((stats: ConversationStats | null) => {
    setLeftStats(stats);
  }, []);

  const handleRightStats = useCallback((stats: ConversationStats | null) => {
    setRightStats(stats);
  }, []);

  const handleLeftTitle = useCallback((title: string | null) => {
    setLeftTitle(title);
  }, []);

  const handleRightTitle = useCallback((title: string | null) => {
    setRightTitle(title);
  }, []);

  // Notify parent when titles change
  useEffect(() => {
    if (prevTitlesRef.current.left !== leftTitle || prevTitlesRef.current.right !== rightTitle) {
      prevTitlesRef.current = { left: leftTitle, right: rightTitle };
      onTitlesAvailable?.(leftTitle, rightTitle);
    }
  }, [leftTitle, rightTitle, onTitlesAvailable]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* 3-pane layout */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left pane - Run 1 (Learning) */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <ComparisonPane
            conversationId={leftConversationId}
            position="left"
            onDrop={onDropLeft}
            onClear={onClearLeft}
            onStatsLoaded={handleLeftStats}
            onTitleLoaded={handleLeftTitle}
          />
        </div>

        {/* Middle pane - Skills */}
        <div className="w-64 flex-shrink-0">
          <SkillsPane
            skills={skills}
            loading={skillsLoading}
            onSelectSkill={onSelectSkill}
          />
        </div>

        {/* Right pane - Run 2 (Efficiency) */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <ComparisonPane
            conversationId={rightConversationId}
            position="right"
            onDrop={onDropRight}
            onClear={onClearRight}
            onStatsLoaded={handleRightStats}
            onTitleLoaded={handleRightTitle}
          />
        </div>
      </div>

      {/* Bottom metrics bar */}
      <MetricsBar leftStats={leftStats} rightStats={rightStats} />
    </div>
  );
}
