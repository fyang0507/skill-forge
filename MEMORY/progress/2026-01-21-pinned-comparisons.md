# Pinned Comparisons Feature

Last Updated: 2026-01-21

## Summary

Added ability to bookmark/pin comparison pairs in comparison mode so users can quickly reload saved comparisons from the sidebar.

## Implementation

### New Files
- `src/hooks/usePinnedComparisons.ts` - React hook managing pinned comparisons in session state

### Modified Files
- `src/components/ForgeDemo.tsx` - Hook integration, pin button with modal, load handler
- `src/components/Sidebar.tsx` - `PinnedComparisonItem` component, new sidebar section
- `src/components/demo/ComparisonPane.tsx` - Added `onTitleLoaded` callback
- `src/components/demo/DemoLayout.tsx` - Title tracking and propagation to parent

## Architecture

### Data Flow
```
ComparisonPane (loads conversation)
  → onTitleLoaded(title)
    → DemoLayout (tracks left/right titles)
      → onTitlesAvailable(leftTitle, rightTitle)
        → ForgeDemo (enables pin button when both titles ready)
```

### Hook Interface
```typescript
interface PinnedComparison {
  id: string;
  name: string;
  leftConversationId: string;
  rightConversationId: string;
  leftTitle: string;
  rightTitle: string;
  createdAt: number;
}

usePinnedComparisons() → {
  pinnedComparisons,
  pinComparison(name, leftId, rightId, leftTitle, rightTitle),
  unpinComparison(id),
  renameComparison(id, newName),
  isPinned(leftId, rightId)
}
```

### Storage
In-session React state only (no localStorage). Pinned comparisons persist during tab navigation but clear on page refresh.

## UI Components

### Pin Button (ForgeDemo header)
- Visible only in comparison mode
- Disabled when: either pane empty, titles not loaded, or already pinned
- Opens modal with name input (default: "{leftTitle} vs {rightTitle}")

### Pinned Comparisons Section (Sidebar)
- Appears between Chat History and Skills when `pinnedComparisons.length > 0`
- Uses existing `CollapsibleSection` with `storageKey="pinned-comparisons"`
- Each item shows: split-view icon, name, subtitle, menu button

### PinnedComparisonItem
- Click → loads comparison (sets mode + IDs)
- Double-click → inline rename
- Menu → Unpin option

## Edge Cases Handled
- **Empty pane during pin**: Button disabled until both panes loaded
- **Duplicate pin attempt**: Button shows "Pinned" (disabled) when already saved
- **Title not yet loaded**: Waits for both titles before enabling pin
