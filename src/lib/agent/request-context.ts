import { AsyncLocalStorage } from 'async_hooks';
import type { UIMessageStreamWriter } from 'ai';

interface RequestContext {
  conversationId?: string;
  sandboxId?: string;
  env?: Record<string, string>;
  streamWriter?: UIMessageStreamWriter;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

export function runWithRequestContext<T>(
  context: RequestContext,
  fn: () => T
): T {
  return asyncLocalStorage.run(context, fn);
}

export function getRequestContext(): RequestContext {
  return asyncLocalStorage.getStore() ?? {};
}

/**
 * Emit tool progress to the stream for real-time UI updates.
 * Called from nested tools (grounding, process-transcript) during streaming.
 */
export function emitToolProgress(toolName: string, data: {
  status: 'streaming' | 'complete';
  delta?: string;
  text?: string;
}): void {
  const ctx = getRequestContext();
  ctx.streamWriter?.write({
    type: 'data-tool-progress',
    data: { toolName, ...data },
    transient: true,
  } as Parameters<UIMessageStreamWriter['write']>[0]);
}
