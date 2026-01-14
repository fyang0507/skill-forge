import { NextResponse } from 'next/server';
import { initDb } from '@/lib/db';
import { getStorage } from '@/lib/skills/storage';

type Params = Promise<{ name: string }>;

// GET /api/skills/{name} - Get skill details
export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  try {
    await initDb();
    const { name } = await params;
    const storage = getStorage();
    const skill = await storage.get(name);

    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(skill);
  } catch (error) {
    console.error('Failed to get skill:', error);
    return NextResponse.json(
      { error: 'Failed to get skill' },
      { status: 500 }
    );
  }
}

// DELETE /api/skills/{name} - Delete a skill
export async function DELETE(
  request: Request,
  { params }: { params: Params }
) {
  try {
    await initDb();
    const { name } = await params;
    const storage = getStorage();

    // Check if skill exists first
    const skill = await storage.get(name);
    if (!skill) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    await storage.delete(name);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete skill:', error);
    return NextResponse.json(
      { error: 'Failed to delete skill' },
      { status: 500 }
    );
  }
}
