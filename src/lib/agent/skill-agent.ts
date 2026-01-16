import * as ai from "ai";
import { z } from 'zod';
import { GoogleGenerativeAIProviderOptions } from '@ai-sdk/google';
import { initLogger, wrapAISDK } from "braintrust";
import { processTranscript } from './tools/process-transcript';

initLogger({
  projectName: "skill-forge-agent",
  apiKey: process.env.BRAINTRUST_API_KEY,
});

const { Experimental_Agent: Agent } = wrapAISDK(ai);

const SKILL_AGENT_INSTRUCTIONS = `You are a Skill Codification Agent.

# First Step - REQUIRED
Call the get-processed-transcript tool with the conversation ID to get the summary of the task conversation.
The conversation ID will be provided in the first user message.
You have no context about the task until you call this tool.

# After Getting Summary
Analyze the summary to determine if this is worth codifying as a skill.

## Check for Existing Skill
If the request mentions "skillToUpdate", first read the existing skill:
<shell>skill get skill-name</shell>

Then merge the new learnings with existing content. Preserve what still works, fix what was wrong, add what was missing.

## Worth Codifying
- Multi-step procedures with non-obvious ordering
- Integration gotchas (auth flows, API quirks, error handling)
- Debugging patterns that required trial-and-error
- User-specific preferences or constraints discovered
- Workarounds for common errors or edge cases

## Skip If
- Single-step operations
- Generic model capabilities (summarization, translation)
- Overly specific one-off tasks
- Nothing was actually "learned"

# Output Format

Use the skill set command (this creates or overwrites):
<shell>skill set skill-name "---
name: skill-name
description: One-line description
---
# Title

## Sections
...
"</shell>

If not worth saving, explain briefly why.

# Code Extraction

When codifying a skill that involved code execution (scripts in sandbox):
1. List sandbox files: <shell>ls</shell>
2. Review code for reusability (remove hardcoded values, add comments if needed)
3. Add reusable code to skill: <shell>skill add-file script.py skill-name</shell>
4. Document in SKILL.md: reference the file, explain parameters, list required env vars

This persists working code so future runs can reuse it via \`skill copy-to-sandbox\`.

# Completion
Shell output returns as a user message. After receiving it:
- **Done** (skill saved): respond only "COMPLETE"
- **More steps** (e.g., after reading skill): continue
- **Error**: fix and retry

# Guidelines
- Name skills generically (e.g., "notion-api-auth" not "fix-johns-notion-error")
- Focus on the procedure, not the specific data used
- Include error handling patterns discovered during the task
- When updating, clearly note what changed
- Be concise but complete`;

/**
 * Tool that fetches and processes the transcript from the database.
 * Accepts conversationId as parameter to fetch the correct conversation.
 */
const processedTranscriptTool = {
  description: 'Get the processed transcript from the previous task conversation. Call this FIRST with the conversation ID to get context for skill creation.',
  inputSchema: z.object({
    conversationId: z.string().describe('The conversation ID to fetch the transcript from'),
  }),
  execute: async ({ conversationId }: { conversationId: string }) => {
    return processTranscript(conversationId);
  },
};

/**
 * Creates the Skill Agent singleton.
 * The agent uses a tool that fetches the transcript from DB by conversation ID.
 */
function createSkillAgent() {
  return new Agent({
    model: 'google/gemini-3-pro-preview',
    instructions: SKILL_AGENT_INSTRUCTIONS,
    tools: {
      'get-processed-transcript': processedTranscriptTool,
    },
    providerOptions: {
      google: {
        thinkingConfig: {
          thinkingLevel: 'low',
          includeThoughts: true,
        },
      } satisfies GoogleGenerativeAIProviderOptions,
    },
  });
}

// Module-level instantiation - created once when module loads
export const skillAgent = createSkillAgent();
