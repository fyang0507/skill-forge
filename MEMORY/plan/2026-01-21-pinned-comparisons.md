# Plan: Pinned Comparisons Feature

## Summary
Add ability to bookmark/pin comparisons so they persist when switching tabs, with a new "Pinned Comparisons" section in the sidebar.

## Problem
Currently, switching from Comparison mode to Normal mode clears all comparison state (`handleToggleComparisonMode` at [ForgeDemo.tsx:395-405](src/components/ForgeDemo.tsx#L395-L405)). Users lose their comparison selections when navigating away.

## Solution

### 1. Create `usePinnedComparisons` Hook (NEW FILE)
**File:** `src/hooks/usePinnedComparisons.ts`

```typescript
interface PinnedComparison {
  id: string;                    // Generated unique ID
  name: string;                  // User-provided name
  leftConversationId: string;
  rightConversationId: string;
  leftTitle: string;             // Cached for display without extra API calls
  rightTitle: string;
  createdAt: number;
}
```

**Storage:** In-session React state only (no localStorage). Pinned comparisons persist during tab navigation but clear on page refresh.

**Expose:** `pinnedComparisons`, `pinComparison()`, `unpinComparison()`, `renameComparison()`, `isPinned()`

### 2. Add Title Callback to ComparisonPane
**File:** [src/components/demo/ComparisonPane.tsx](src/components/demo/ComparisonPane.tsx)

- Add `onTitleLoaded?: (title: string) => void` prop
- Call it after conversation loads (line 56-57 already has title)

### 3. Update DemoLayout to Track Titles
**File:** [src/components/demo/DemoLayout.tsx](src/components/demo/DemoLayout.tsx)

- Add `onTitlesLoaded?: (leftTitle: string, rightTitle: string) => void` prop
- Track left/right titles from ComparisonPane callbacks
- Propagate to parent when both are loaded

### 4. Integrate in ForgeDemo
**File:** [src/components/ForgeDemo.tsx](src/components/ForgeDemo.tsx)

- Import and use `usePinnedComparisons` hook
- Track conversation titles from DemoLayout
- Add "Pin Comparison" button in header (next to mode toggle, ~line 474)
  - Only visible when `isComparisonMode`
  - Disabled when: either pane is empty, titles not yet loaded, or already pinned
  - Enabled only when both panes have loaded conversations with titles
- Add pin name input modal (simple dialog with text input)
  - Default value: "{leftTitle} vs {rightTitle}"
  - User can edit before confirming
- Add `handleLoadPinnedComparison(comparison)` - sets mode + IDs
- Pass pinned comparison props to Sidebar

### 5. Add Sidebar Section
**File:** [src/components/Sidebar.tsx](src/components/Sidebar.tsx)

**New props:**
```typescript
pinnedComparisons?: PinnedComparison[];
onLoadPinnedComparison?: (comparison: PinnedComparison) => void;
onUnpinComparison?: (id: string) => void;
onRenamePinnedComparison?: (id: string, name: string) => void;
```

**New component:** `PinnedComparisonItem`
- Split-view icon + name + subtitle showing "{left} vs {right}"
- Click to load comparison
- Double-click to rename
- Menu with "Unpin" option

**New section:** Between Chat History and Skills
- Use existing `CollapsibleSection` with `storageKey="pinned-comparisons"`
- Only render if `pinnedComparisons.length > 0`

## File Changes

| File | Change |
|------|--------|
| `src/hooks/usePinnedComparisons.ts` | **NEW** - Hook with in-session state |
| `src/components/demo/ComparisonPane.tsx` | Add `onTitleLoaded` callback |
| `src/components/demo/DemoLayout.tsx` | Track and expose titles |
| `src/components/ForgeDemo.tsx` | Hook integration, pin button, load handler |
| `src/components/Sidebar.tsx` | New props, `PinnedComparisonItem`, new section |

## UI Flow

1. **Pin:** In comparison mode with both panes filled → Click "Pin Comparison" button → Name input modal appears → Enter name → Saved to sidebar
2. **Load:** Click pinned item in sidebar → Switches to comparison mode with conversations loaded
3. **Unpin:** Click menu on pinned item → Select "Unpin" → Removed from list
4. **Rename:** Double-click pinned item name → Edit inline → Enter to save

## Edge Cases
- **Empty pane during pin:** "Pin Comparison" button only enabled when BOTH left and right panes have conversations loaded
- **Empty pane when loading pinned:** If a pinned comparison references a deleted conversation:
  - Load what exists, show placeholder/error for missing pane
  - Display message: "Conversation was deleted"
- **Duplicate pin attempt:** Button shows "Pinned" (disabled) when current comparison already saved
- **Title not yet loaded:** Wait for both titles to load before enabling pin button (avoid pinning with placeholder names)

## Verification
1. Pin a comparison → Should appear in sidebar "Pinned Comparisons" section
2. Click pinned comparison → Should load in comparison mode with correct conversations
3. Switch between Normal/Comparison modes → Pinned items remain in sidebar
4. In comparison mode with only one pane filled → Pin button should be disabled
5. In comparison mode with both panes filled → Pin button should be enabled
6. Try to pin same comparison twice → Button should show "Pinned" (disabled)
7. Delete a pinned comparison → Should be removed from sidebar
