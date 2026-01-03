import { ToolLoopAgent } from 'ai';
import { google } from '@ai-sdk/google';
import { createSkillCommands } from '@/lib/tools/skill-commands';

const FORGE_INSTRUCTIONS = `You are SkillForge, an agent that learns from YouTube tutorials
and creates reusable skill files.

## Workflow

When given a YouTube URL:
1. Use url_context to analyze the video content
2. Extract key learnings, gotchas, best practices
3. Output a skill file in the exact format below

## Output Format

You MUST output the skill in this exact format at the end of your response:

<skill name="skill-name">
---
name: skill-name
description: One-line description of when to use this skill
---
# Title
## Key Learnings
## Common Gotchas
## Working Pattern
</skill>

## Important Notes

- Use url_context to analyze YouTube videos - it can read video content directly
- Use google_search if you need additional context or documentation
- Extract practical, actionable knowledge from tutorials
- Focus on gotchas and common mistakes that developers encounter
- The skill name should be kebab-case (e.g., stripe-webhooks, aws-cognito)`;

export function createForgeAgent() {
  return new ToolLoopAgent({
    model: 'google/gemini-3.0-flash',
    instructions: FORGE_INSTRUCTIONS,
    tools: {
      google_search: google.tools.googleSearch({}),
      url_context: google.tools.urlContext({}),
    },
  });
}

export async function saveSkillFromOutput(output: string): Promise<string | null> {
  const skillMatch = output.match(/<skill\s+name="([^"]+)">([\s\S]*?)<\/skill>/);
  if (!skillMatch) return null;

  const [, name, content] = skillMatch;
  const commands = createSkillCommands();
  const setCommand = commands['skill set'];

  const trimmedContent = content.trim();
  await setCommand(`${name} "${trimmedContent}"`);

  return name;
}
