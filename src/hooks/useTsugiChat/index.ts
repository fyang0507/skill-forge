// Re-export main hook
export { useTsugiChat } from './hook';

// Re-export types
export type {
  Message,
  MessagePart,
  MessageMetadata,
  TsugiDataTypes,
  SandboxData,
  UsageData,
  ToolProgressData,
  CumulativeStats,
  ChatStatus,
  SandboxStatus,
  UseTsugiChatOptions,
  MessageStats,
} from './types';

// Re-export utilities
export {
  generateMessageId,
  createUserMessage,
  createInitialAssistantMessage,
  stripShellTags,
} from './message-builders';

export {
  createEmptyStats,
  calculateCumulativeStats,
  updateCumulativeStats,
} from './stats-utils';
