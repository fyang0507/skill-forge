/**
 * Centralized message transformation utilities.
 *
 * Message formats in the system:
 * 1. UIMessage - Frontend format with parts, iterations, stats (useForgeChat)
 * 2. ModelMessage - AI SDK format for LLM calls (with proper tool-call/tool-result structure)
 * 3. DBMessage - Database storage format with parts and iterations
 */

import type {
  ModelMessage,
  TextPart,
  ToolCallPart,
  ToolResultPart,
} from 'ai';

// ============================================================================
// Type Definitions
// ============================================================================

/** Frontend message format used in useForgeChat */
export interface UIMessage {
  id: string;
  role: 'user' | 'assistant';
  rawContent: string;
  iterations?: AgentIteration[];
  parts?: MessagePart[];
}

/** Single iteration of the agentic loop */
export interface AgentIteration {
  rawContent: string;
  toolOutput?: string;
}

/** Message part types stored in the database */
export type MessagePart =
  | { type: 'text'; content: string }
  | { type: 'reasoning'; content: string }
  | {
      type: 'tool';  // Legacy shell tool (deprecated)
      command: string;
      commandId: string;
      content: string;  // Result
    }
  | {
      type: 'agent-tool';  // AI SDK tools (search, url_context, shell)
      toolName: string;
      toolArgs: Record<string, unknown>;
      toolCallId: string;
      content: string;  // Result
    }
  | {
      type: 'sources';  // Grounding citations from Gemini
      sources: Array<{ id: string; url: string; title: string }>;
    };

/** Database storage format (matches UIMessage structure) */
export interface DBMessage {
  role: 'user' | 'assistant';
  rawContent: string;
  iterations?: AgentIteration[];
  parts?: MessagePart[];
}

// ============================================================================
// Parts to Iteration Extraction
// ============================================================================

/**
 * Extract iteration data (rawContent + toolOutput) from message parts.
 * Works with both UI MessagePart and DB MessagePart formats.
 * Used by useForgeChat to build iterations for API calls.
 */
export function partsToIteration(
  parts: Array<{ type: string; content?: string }>
): AgentIteration | undefined {
  const rawContent = parts
    .filter((p) => p.type === 'text')
    .map((p) => p.content || '')
    .join('\n')
    .trim();

  if (!rawContent) return undefined;

  const toolOutput = parts
    .filter((p) => p.type === 'tool' || p.type === 'agent-tool')
    .map((p) => p.content || '')
    .filter(Boolean)
    .join('\n') || undefined;

  return { rawContent, toolOutput };
}

// ============================================================================
// Format Conversions
// ============================================================================

/**
 * Convert UI/DB messages to AI SDK ModelMessage format with proper tool structure.
 * Preserves tool-call/tool-result structure for KV cache efficiency.
 */
export function toModelMessages(messages: Array<DBMessage | UIMessage>): ModelMessage[] {
  const result: ModelMessage[] = [];

  for (const message of messages) {
    if (message.role === 'user') {
      result.push({ role: 'user', content: message.rawContent });
      continue;
    }

    // Handle legacy messages with iterations but no parts
    if (!message.parts?.length) {
      if (message.iterations?.length) {
        // Fallback: convert iterations to simple text messages
        for (const iter of message.iterations) {
          result.push({ role: 'assistant', content: iter.rawContent });
          if (iter.toolOutput) {
            // Can't reconstruct proper tool format, use user role
            result.push({ role: 'user', content: `[Tool Output]\n${iter.toolOutput}` });
          }
        }
      }
      continue;
    }

    // Build assistant message content array
    const assistantContent: Array<TextPart | ToolCallPart> = [];
    const toolResults: ToolResultPart[] = [];

    for (const part of message.parts) {
      if (part.type === 'text') {
        assistantContent.push({ type: 'text', text: part.content });
      } else if (part.type === 'agent-tool' && part.toolCallId) {
        // Tool call goes in assistant message
        assistantContent.push({
          type: 'tool-call',
          toolCallId: part.toolCallId,
          toolName: part.toolName,
          input: part.toolArgs,  // AI SDK uses 'input' not 'args'
        });
        // Tool result goes in separate tool message
        if (part.content) {
          toolResults.push({
            type: 'tool-result',
            toolCallId: part.toolCallId,
            toolName: part.toolName,
            output: { type: 'text', value: part.content },  // AI SDK ToolResultOutput format
          });
        }
      }
      // Skip 'reasoning', 'sources', and legacy 'tool' parts - not needed for model context
    }

    if (assistantContent.length > 0) {
      result.push({ role: 'assistant', content: assistantContent });
    }
    if (toolResults.length > 0) {
      result.push({ role: 'tool', content: toolResults });
    }
  }

  return result;
}

/**
 * Convert DB messages to a human-readable transcript string.
 * Used by the skill agent for transcript processing.
 *
 * Processes the `parts` array which contains the full execution history:
 * - reasoning: AI reasoning/thinking
 * - agent-tool: Tool calls with name, args, and output
 * - text: Plain text responses
 */
export function toTranscriptString(messages: DBMessage[]): string {
  const output: string[] = [];

  for (const m of messages) {
    if (m.role === 'user') {
      output.push(`[user] ${m.rawContent}`);
    } else if (m.parts && m.parts.length > 0) {
      // Process parts array for full execution history
      for (const part of m.parts) {
        if (part.type === 'reasoning') {
          output.push(`[reasoning] ${part.content}`);
        } else if (part.type === 'agent-tool') {
          // Format tool call with name and args
          const argsStr = JSON.stringify(part.toolArgs);
          output.push(`[tool-call] ${part.toolName}: ${argsStr}`);
          if (part.content) {
            output.push(`[tool-output] ${part.content}`);
          }
        } else if (part.type === 'text') {
          output.push(`[assistant] ${part.content}`);
        }
      }
    } else if (m.iterations && m.iterations.length > 0) {
      // Fallback to iterations for legacy messages without parts
      for (const iter of m.iterations) {
        output.push(`[assistant] ${iter.rawContent}`);
        if (iter.toolOutput) {
          output.push(`[tool] ${iter.toolOutput}`);
        }
      }
    }
  }

  return output.join('\n\n');
}
