# Plan: TaskAgent UI Improvements

## Scope

Two UI/UX improvements for taskAgent:
1. **Persistent skill suggestion** - Re-suggest codification when user ignores initial proposal
2. **COMPLETE badge** - Status badge instead of plain text

---

## 1. Persistent Skill Suggestion

**Problem**: Agent outputs `skill suggest` then STOPs. If user ignores and continues conversation, agent never re-suggests.

**File**: [task-agent.ts](src/lib/agent/task-agent.ts)

**Changes**:

Add Phase 4 to `TASK_AGENT_INSTRUCTIONS` (after Phase 3):

```markdown
## Phase 4: Re-suggestion (Persistent Learning)

If you previously suggested skill codification but the user continued without codifying:
- Re-suggest at the next natural completion point (after follow-up task completes)
- Use updated description incorporating all learnings from the conversation
- Do NOT re-suggest if user explicitly declined or topic changed significantly
```

Also update Phase 3 to remove any hard "STOP" directive that prevents continuation.

---

## 2. COMPLETE Status Badge

**Problem**: "COMPLETE" renders as plain text message.

**File**: [ChatMessage.tsx](src/components/ChatMessage.tsx)

**Changes**:

Add `CompleteBadge` component (~line 224, before TextPart):

```tsx
function CompleteBadge() {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full text-sm font-medium">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span>COMPLETE</span>
    </div>
  );
}
```

Modify `TextPart` to detect COMPLETE:

```tsx
function TextPart({ content }: { content: string }) {
  if (!content.trim()) return null;

  const trimmed = content.trim();

  // Exact match: just "COMPLETE"
  if (trimmed === 'COMPLETE') {
    return <CompleteBadge />;
  }

  // Check if ends with COMPLETE on own line
  const lines = trimmed.split('\n');
  const lastLine = lines[lines.length - 1].trim();
  if (lastLine === 'COMPLETE' && lines.length > 1) {
    const textWithoutComplete = lines.slice(0, -1).join('\n').trim();
    return (
      <>
        {textWithoutComplete && (
          <div className="prose prose-invert prose-sm max-w-none...">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{textWithoutComplete}</ReactMarkdown>
          </div>
        )}
        <div className="mt-3"><CompleteBadge /></div>
      </>
    );
  }

  // Regular markdown rendering (existing code)
  return (
    <div className="prose prose-invert prose-sm max-w-none...">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
```

---

## Verification

1. **Persistent suggestion**: Complete task → ignore codify button → ask follow-up → complete follow-up → verify re-suggestion appears
2. **COMPLETE badge**: Complete any task → verify emerald badge with checkmark renders instead of plain "COMPLETE" text
