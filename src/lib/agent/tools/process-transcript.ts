import * as ai from "ai";
import { getConversation } from '@/lib/db';
import { initLogger, wrapAISDK } from "braintrust";
import { toTranscriptString, type DBMessage } from '@/lib/messages/transform';

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
 * Fetch transcript from database by conversation ID and process it.
 * Returns a compressed summary for skill codification.
 */
export async function processTranscript(conversationId: string): Promise<string> {
  // Fetch messages from database
  const result = await getConversation(conversationId);

  if (!result) {
    return 'Error: Conversation not found';
  }

  // Build transcript from messages using centralized transform utility
  const rawTranscript = toTranscriptString(result.messages as DBMessage[]);

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
