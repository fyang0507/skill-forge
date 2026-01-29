import { createTaskAgent } from '@/lib/agent/task-agent';
import { createSkillAgent } from '@/lib/agent/skill-agent';
import { clearSandboxExecutor, getSandboxExecutor } from '@/lib/sandbox/executor';
import { mergePlaygroundEnv } from '@/lib/tools/playground-env';
import { runWithRequestContext } from '@/lib/agent/request-context';
import { createAgentUIStreamResponse, consumeStream, type UIMessage, type Agent } from 'ai';

type AgentMode = 'task' | 'codify-skill';

export async function POST(req: Request) {
  const { messages: initialMessages, mode = 'task', conversationId, env: uiEnv, sandboxId: requestSandboxId } = await req.json() as {
    messages: UIMessage[];
    mode?: AgentMode;
    conversationId?: string;
    env?: Record<string, string>;
    sandboxId?: string;
  };

  // Sandbox lifecycle:
  // - If sandboxId provided: reconnect to existing sandbox (continuing conversation)
  // - If no sandboxId: create fresh sandbox for new conversation
  // forceNew=true ensures we don't reuse a stale cached executor from a previous conversation
  const isNewConversation = !requestSandboxId;
  const executor = await getSandboxExecutor(requestSandboxId, isNewConversation);

  // Merge UI env vars with .env.playground (local dev) or Vercel env (production)
  const mergedEnv = mergePlaygroundEnv(uiEnv);

  // Validate: task mode requires messages, codify-skill mode requires conversationId
  if (mode === 'codify-skill') {
    if (!conversationId) {
      return Response.json({ error: 'conversationId is required for codify-skill mode' }, { status: 400 });
    }
  } else if (!initialMessages || !Array.isArray(initialMessages) || initialMessages.length === 0) {
    return Response.json({ error: 'Messages array is required' }, { status: 400 });
  }

  // Initialize sandbox upfront for new task conversations
  // This allows us to pass the sandbox ID in headers before streaming starts
  let currentSandboxId: string | undefined = requestSandboxId || undefined;
  if (mode === 'task' && isNewConversation) {
    currentSandboxId = await executor.initialize();
  }

  // Track sandbox usage for cleanup on abort
  let sandboxUsed = false;

  // Prepare messages for the agent
  let messages: UIMessage[];
  if (mode === 'codify-skill') {
    // Filter to only include skill agent messages (exclude task agent history)
    // This prevents the skill agent from being confused by task agent's tool calls
    const skillMessages = initialMessages.filter(
      (m) => (m as UIMessage & { metadata?: { agent?: string } }).metadata?.agent === 'skill'
    );
    // Use skill agent history if available, otherwise start fresh with 'Start'
    // The skill agent will call get_processed_transcript to fetch task history from DB
    messages = skillMessages.length > 0 ? skillMessages : [{
      id: crypto.randomUUID(),
      role: 'user',
      parts: [{ type: 'text', text: 'Start' }],
    } as UIMessage];
  } else {
    messages = [...initialMessages];
  }

  // Create agent within request context so it picks up user-provided API key from env
  // Note: The agent and streaming execution must happen within this context
  // so nested tools can access conversationId, sandboxId, and env
  return runWithRequestContext(
    { conversationId, sandboxId: currentSandboxId, env: mergedEnv },
    async () => {
      // Cast to generic Agent type since task and skill agents have different tool sets
      // but createAgentUIStreamResponse only needs the common Agent interface
      const agent = (mode === 'codify-skill' ? createSkillAgent() : createTaskAgent()) as unknown as Agent;

      const startTime = Date.now();

      // Use createAgentUIStreamResponse for proper abort signal propagation
      // The consumeSseStream option ensures onFinish is called even when aborted
      // See: https://ai-sdk.dev/docs/troubleshooting/stream-abort-handling
      return createAgentUIStreamResponse({
        agent,
        uiMessages: messages,
        abortSignal: req.signal,
        consumeSseStream: consumeStream,
        headers: {
          // Pass sandbox ID in header for new conversations
          // Client reads this via onResponse callback
          ...(currentSandboxId && currentSandboxId !== requestSandboxId
            ? { 'X-Sandbox-Id': currentSandboxId }
            : {}),
        },
        onStepFinish: async (stepResult) => {
          // Track sandbox usage from tool calls for cleanup on abort
          // StepResult.toolCalls contains the tool calls made in this step
          const toolCalls = stepResult.toolCalls as Array<{ toolName?: string; args?: { command?: string } }>;
          if (toolCalls?.some((tc) => {
            if (tc.toolName !== 'shell') return false;
            const command = tc.args?.command;
            return command && !command.startsWith('skill ');
          })) {
            sandboxUsed = true;
          }
        },
        onFinish: async ({ isAborted }) => {
          const executionTimeMs = Date.now() - startTime;

          if (isAborted) {
            console.log('[Agent] Stream aborted by user');
            // Clean up sandbox if user aborted and sandbox was used (only in deployed env)
            if (sandboxUsed && process.env.VERCEL === '1') {
              try {
                await clearSandboxExecutor();
                console.log('[Agent] Sandbox cleaned up after abort');
              } catch (cleanupError) {
                console.error('[Agent] Failed to cleanup sandbox:', cleanupError);
              }
            }
          } else {
            console.log('[Agent] Stream completed normally', { executionTimeMs });
          }
        },
        onError: (error) => {
          console.error('[Agent] Stream error:', error);
          return error instanceof Error ? error.message : 'Unknown error';
        },
      });
    }
  );
}
