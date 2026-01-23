'use client';

import { useState, useEffect, useCallback } from 'react';

export interface PinnedComparison {
  id: string;
  name: string;
  leftConversationId: string;
  rightConversationId: string;
  leftTitle: string;
  rightTitle: string;
  createdAt: number;
}

interface UsePinnedComparisonsReturn {
  pinnedComparisons: PinnedComparison[];
  isLoading: boolean;
  pinComparison: (
    name: string,
    leftConversationId: string,
    rightConversationId: string,
    leftTitle: string,
    rightTitle: string
  ) => Promise<string | null>;
  unpinComparison: (id: string) => Promise<void>;
  renameComparison: (id: string, newName: string) => Promise<void>;
  isPinned: (leftConversationId: string | null, rightConversationId: string | null) => boolean;
}

export function usePinnedComparisons(): UsePinnedComparisonsReturn {
  const [pinnedComparisons, setPinnedComparisons] = useState<PinnedComparison[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch pinned comparisons on mount
  const fetchComparisons = useCallback(async () => {
    try {
      const response = await fetch('/api/comparisons');
      if (response.ok) {
        const data = await response.json();
        setPinnedComparisons(data);
      }
    } catch (error) {
      console.error('Failed to fetch pinned comparisons:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchComparisons();
  }, [fetchComparisons]);

  const pinComparison = useCallback(async (
    name: string,
    leftConversationId: string,
    rightConversationId: string,
    leftTitle: string,
    rightTitle: string
  ): Promise<string | null> => {
    try {
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          leftConversationId,
          rightConversationId,
          leftTitle,
          rightTitle,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to pin comparison:', error);
        return null;
      }

      const newComparison = await response.json();
      setPinnedComparisons(prev => [newComparison, ...prev]);
      return newComparison.id;
    } catch (error) {
      console.error('Failed to pin comparison:', error);
      return null;
    }
  }, []);

  const unpinComparison = useCallback(async (id: string): Promise<void> => {
    // Optimistic update
    const previousComparisons = pinnedComparisons;
    setPinnedComparisons(prev => prev.filter(c => c.id !== id));

    try {
      const response = await fetch(`/api/comparisons/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on failure
        setPinnedComparisons(previousComparisons);
        console.error('Failed to unpin comparison');
      }
    } catch (error) {
      // Revert on error
      setPinnedComparisons(previousComparisons);
      console.error('Failed to unpin comparison:', error);
    }
  }, [pinnedComparisons]);

  const renameComparison = useCallback(async (id: string, newName: string): Promise<void> => {
    // Optimistic update
    const previousComparisons = pinnedComparisons;
    setPinnedComparisons(prev =>
      prev.map(c => (c.id === id ? { ...c, name: newName } : c))
    );

    try {
      const response = await fetch(`/api/comparisons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        // Revert on failure
        setPinnedComparisons(previousComparisons);
        console.error('Failed to rename comparison');
      }
    } catch (error) {
      // Revert on error
      setPinnedComparisons(previousComparisons);
      console.error('Failed to rename comparison:', error);
    }
  }, [pinnedComparisons]);

  const isPinned = useCallback((
    leftConversationId: string | null,
    rightConversationId: string | null
  ): boolean => {
    if (!leftConversationId || !rightConversationId) return false;
    return pinnedComparisons.some(
      c => c.leftConversationId === leftConversationId &&
           c.rightConversationId === rightConversationId
    );
  }, [pinnedComparisons]);

  return {
    pinnedComparisons,
    isLoading,
    pinComparison,
    unpinComparison,
    renameComparison,
    isPinned,
  };
}
