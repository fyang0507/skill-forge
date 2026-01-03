import { createForgeAgent, saveSkillFromOutput } from '@/lib/agent/forge-agent';

export async function POST(req: Request) {
  const { prompt } = await req.json();

  if (!prompt) {
    return Response.json({ error: 'Prompt is required' }, { status: 400 });
  }

  const agent = createForgeAgent();
  const result = await agent.stream({ prompt });

  // Create a transform stream that captures the output for skill extraction
  let fullOutput = '';

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      fullOutput += text;
      controller.enqueue(chunk);
    },
    async flush() {
      // After stream completes, try to save the skill
      try {
        const skillName = await saveSkillFromOutput(fullOutput);
        if (skillName) {
          console.log(`Skill "${skillName}" saved successfully`);
        }
      } catch (error) {
        console.error('Failed to save skill:', error);
      }
    },
  });

  const textStream = result.toTextStreamResponse();
  const body = textStream.body;

  if (!body) {
    return Response.json({ error: 'No response body' }, { status: 500 });
  }

  const transformedStream = body.pipeThrough(transformStream);

  return new Response(transformedStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  });
}
