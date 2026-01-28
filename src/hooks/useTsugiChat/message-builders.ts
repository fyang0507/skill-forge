import type { Message, MessageMetadata } from './types';

/**
 * Generate a unique message ID
 */
export function generateMessageId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Create a user message in AI SDK UIMessage format.
 */
export function createUserMessage(
  content: string,
  agent: 'task' | 'skill',
  id?: string
): Message {
  const metadata: MessageMetadata = { agent };
  return {
    id: id || generateMessageId(),
    role: 'user',
    parts: [{ type: 'text', text: content }],
    metadata,
  };
}

/**
 * Create an initial empty assistant message placeholder.
 */
export function createInitialAssistantMessage(
  id: string,
  agent: 'task' | 'skill'
): Message {
  const metadata: MessageMetadata = { agent };
  return {
    id,
    role: 'assistant',
    parts: [],
    metadata,
  };
}

/**
 * Strip <shell> tags from text and collapse excessive whitespace.
 * Also strips incomplete shell tags that are still streaming.
 */
export function stripShellTags(text: string): string {
  return text
    .replace(/<shell>[\s\S]*?<\/shell>/g, '') // Remove complete shell tags
    .replace(/<shell>[\s\S]*$/g, '') // Remove incomplete shell tag at end
    .replace(/\n{3,}/g, '\n\n'); // Collapse 3+ newlines to 2
}
