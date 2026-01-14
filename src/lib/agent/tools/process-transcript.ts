import * as ai from "ai";
import { getConversation } from '@/lib/db';
import { initLogger, wrapAISDK } from "braintrust";

initLogger({
  projectName: "skill-forge-agent",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

const { generateText } = wrapAISDK(ai);

const TRANSCRIPT_PROCESSING_PROMPT = `You are a transcript processor. Analyze this task conversation and produce a concise summary for skill codification.

Extract and summarize:
1. **Goal**: What was the user trying to accomplish?
2. **Steps**: Key steps taken (in order)
3. **Commands**: Important shell commands used
4. **Gotchas**: Non-obvious issues, errors, or edge cases encountered
5. **Solutions**: How problems were resolved
6. **Patterns**: Reusable patterns or best practices discovered

Be concise but preserve all procedural knowledge needed to recreate the task.

Transcript:
`;

/**
 * Build a transcript string from messages fetched from the database.
 * Only includes task messages (excludes codify-skill conversation).
 */
function buildTranscriptFromMessages(messages: Array<{
  role: 'user' | 'assistant';
  rawContent: string;
  iterations?: Array<{ rawContent: string; toolOutput?: string }>;
}>): string {
  const parts: string[] = [];

  for (const m of messages) {
    if (m.role === 'user') {
      parts.push(`[user] ${m.rawContent}`);
    } else if (m.iterations && m.iterations.length > 0) {
      for (const iter of m.iterations) {
        parts.push(`[assistant] ${iter.rawContent}`);
        if (iter.toolOutput) {
          parts.push(`[tool] ${iter.toolOutput}`);
        }
      }
    }
  }

  return parts.join('\n\n');
}

/**
 * Fetch transcript from database by conversation ID and process it.
 * Returns a compressed summary for skill codification.
 */
export async function processTranscript(conversationId: string): Promise<string> {
  // Fetch messages from database
  const result = await getConversation(conversationId);

  if (!result) {
    return 'Error: Conversation not found';
  }

  // Build transcript from messages
  const rawTranscript = buildTranscriptFromMessages(result.messages);

  if (!rawTranscript.trim()) {
    return 'Error: No messages found in conversation';
  }

  // Process with Gemini Flash
  const generated = await generateText({
    model: 'google/gemini-3-flash',
    prompt: TRANSCRIPT_PROCESSING_PROMPT + rawTranscript,
  });

  return generated.text;
}
