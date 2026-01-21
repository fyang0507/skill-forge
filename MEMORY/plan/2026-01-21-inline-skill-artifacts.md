# Plan: Inline Skill Artifacts (Simplified)

## Summary
Remove the "Skills Created" pane from comparison mode and instead show skill creation inline in chat messages as expandable artifacts, similar to Claude Desktop's artifact display.

## Changes Overview

| File | Change |
|------|--------|
| `src/components/demo/DemoLayout.tsx` | Remove SkillsPane, simplify to 2-pane layout |
| `src/components/ChatMessage.tsx` | Add SkillArtifact component for `skill set` results |
| `src/components/ForgeDemo.tsx` | Remove skills props from DemoLayout |

---

## Step 1: Update DemoLayout - Remove Skills Pane

**File:** [src/components/demo/DemoLayout.tsx](src/components/demo/DemoLayout.tsx)

Remove the SkillsPane and simplify to a 2-pane layout (left + right conversations only):

```typescript
// Remove these imports and props:
// - SkillsPane import
// - skills, skillsLoading, onSelectSkill props

// Change layout from 3-pane to 2-pane:
<div className="flex-1 flex gap-4 p-4 overflow-hidden">
  {/* Left pane - Run 1 (Learning) */}
  <div className="flex-1 min-w-0 overflow-hidden">
    <ComparisonPane ... />
  </div>

  {/* Right pane - Run 2 (Efficiency) */}
  <div className="flex-1 min-w-0 overflow-hidden">
    <ComparisonPane ... />
  </div>
</div>
```

---

## Step 2: Add Skill Artifact to ChatMessage

**File:** [src/components/ChatMessage.tsx](src/components/ChatMessage.tsx)

### 2a. Add SkillArtifact component

Create a new component that renders when a skill is saved:

```typescript
interface SkillArtifactProps {
  skillName: string;
}

function SkillArtifact({ skillName }: SkillArtifactProps) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (!expanded && !content) {
      // Fetch skill content on first expand
      setLoading(true);
      try {
        const res = await fetch(`/api/skills/${encodeURIComponent(skillName)}`);
        if (res.ok) {
          const skill = await res.json();
          setContent(skill.content);
        }
      } catch (e) {
        console.error('Failed to fetch skill:', e);
      }
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  return (
    <div className="my-2 border border-emerald-500/30 rounded-lg overflow-hidden">
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 w-full px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors text-left"
      >
        <ChevronIcon expanded={expanded} />
        <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-emerald-400 font-medium">Skill Created</span>
        <code className="text-sm text-zinc-400 bg-zinc-700 px-1.5 rounded">{skillName}</code>
      </button>
      {expanded && (
        <div className="px-3 py-2 bg-zinc-900 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="text-zinc-500 text-sm">Loading...</div>
          ) : content ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-zinc-500 text-sm">Failed to load skill content</div>
          )}
        </div>
      )}
    </div>
  );
}
```

### 2b. Add detection function

Parse tool results to detect skill creation:

```typescript
// Detect skill set command results
function parseSkillCreation(parts: MessagePart[]): string | null {
  for (const part of parts) {
    // Check shell tool results for "Skill "X" saved" pattern
    const isShellTool = part.type === 'agent-tool' && part.toolName === 'shell';
    const command = part.toolArgs?.command as string | undefined;

    if (isShellTool && command?.startsWith('skill set ')) {
      // Extract skill name from result: 'Skill "name" saved'
      const match = part.content?.match(/Skill "([^"]+)" saved/);
      if (match) {
        return match[1];
      }
    }
  }
  return null;
}
```

### 2c. Render SkillArtifact in message

In the message rendering section, add artifact display:

```typescript
// After rendering parts, check for skill creation
const createdSkillName = parseSkillCreation(message.parts);
// ... existing renders ...
{createdSkillName && <SkillArtifact skillName={createdSkillName} />}
```

---

## Step 3: Update ForgeDemo

**File:** [src/components/ForgeDemo.tsx](src/components/ForgeDemo.tsx)

Remove skills props from DemoLayout in comparison mode:

```typescript
{isComparisonMode ? (
  <DemoLayout
    leftConversationId={leftConversationId}
    rightConversationId={rightConversationId}
    onDropLeft={handleAddToLeft}
    onDropRight={handleAddToRight}
    onClearLeft={handleClearLeft}
    onClearRight={handleClearRight}
    onTitlesAvailable={handleTitlesAvailable}
  />
) : (
  // ... normal chat mode
)}
```

---

## Verification

1. Run a task that creates a skill
2. In the conversation, where `skill set` was executed, verify a "Skill Created" artifact appears
3. Click the artifact to expand and see the skill content
4. Enter comparison mode - verify only left/right panes appear (no skills pane)
5. Check that the skill artifact is visible in the conversation history within comparison panes
