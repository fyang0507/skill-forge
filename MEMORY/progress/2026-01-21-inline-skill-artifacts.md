# Inline Skill Artifacts

Last Updated: 2026-01-21

## Summary

Replaced the separate "Skills Created" pane in comparison mode with inline skill artifacts that appear directly in chat messages when skills are created.

## Changes

### DemoLayout.tsx
- Removed `SkillsPane` import and component
- Removed `skills`, `skillsLoading`, `onSelectSkill` props from interface
- Simplified from 3-pane to 2-pane layout (left + right conversation panes only)

### ChatMessage.tsx
- Added `parseSkillCreation(parts)` - detects `skill set` commands by checking shell tool results for `Skill "X" saved` pattern
- Added `SkillArtifact` component:
  - Emerald-styled expandable card with "Skill Created" badge
  - Lazy-loads skill content via `/api/skills/{name}` on first expand
  - Displays content as plain preformatted text
- Renders `<SkillArtifact>` after `<MessageStats>` when skill creation detected

### ForgeDemo.tsx
- Removed `skills`, `skillsLoading`, `onSelectSkill` props from `<DemoLayout>` in comparison mode

## Design Decisions

- **Inline over pane**: Skills appear contextually where created rather than in separate panel
- **Lazy loading**: Content fetched only when user expands, reduces initial load
- **Plain text**: Skill content shown as preformatted text (not rendered markdown) per user preference
