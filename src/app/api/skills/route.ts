import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { getStorage } from '@/lib/skills/storage';

// GET /api/skills - List all skills
export async function GET() {
  try {
    await initDb();
    const storage = getStorage();
    const skills = await storage.list();
    return NextResponse.json(skills);
  } catch (error) {
    console.error('Failed to get skills:', error);
    return NextResponse.json(
      { error: 'Failed to get skills' },
      { status: 500 }
    );
  }
}

// POST /api/skills - Create a new skill
export async function POST(request: Request) {
  try {
    await initDb();
    const storage = getStorage();
    const body = await request.json();

    if (!body.name || !body.content) {
      return NextResponse.json(
        { error: 'name and content are required' },
        { status: 400 }
      );
    }

    await storage.set(body.name, body.content);
    return NextResponse.json({ success: true, name: body.name });
  } catch (error) {
    console.error('Failed to create skill:', error);
    return NextResponse.json(
      { error: 'Failed to create skill' },
      { status: 500 }
    );
  }
}
