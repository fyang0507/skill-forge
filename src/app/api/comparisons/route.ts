import { NextResponse } from 'next/server';
import { initDb, getPinnedComparisons, createPinnedComparison } from '@/lib/db';

// GET /api/comparisons - List all pinned comparisons
export async function GET() {
  try {
    await initDb();
    const comparisons = await getPinnedComparisons();

    // Transform to frontend format (camelCase)
    const result = comparisons.map(c => ({
      id: c.id,
      name: c.name,
      leftConversationId: c.left_conversation_id,
      rightConversationId: c.right_conversation_id,
      leftTitle: c.left_title,
      rightTitle: c.right_title,
      createdAt: c.created_at,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to get pinned comparisons:', error);
    return NextResponse.json(
      { error: 'Failed to get pinned comparisons' },
      { status: 500 }
    );
  }
}

// POST /api/comparisons - Create a new pinned comparison
export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();

    const { name, leftConversationId, rightConversationId, leftTitle, rightTitle } = body;

    if (!name || !leftConversationId || !rightConversationId || !leftTitle || !rightTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const comparison = await createPinnedComparison({
      name,
      leftConversationId,
      rightConversationId,
      leftTitle,
      rightTitle,
    });

    // Transform to frontend format
    return NextResponse.json({
      id: comparison.id,
      name: comparison.name,
      leftConversationId: comparison.left_conversation_id,
      rightConversationId: comparison.right_conversation_id,
      leftTitle: comparison.left_title,
      rightTitle: comparison.right_title,
      createdAt: comparison.created_at,
    });
  } catch (error) {
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { error: 'This comparison is already pinned' },
        { status: 409 }
      );
    }

    console.error('Failed to create pinned comparison:', error);
    return NextResponse.json(
      { error: 'Failed to create pinned comparison' },
      { status: 500 }
    );
  }
}
