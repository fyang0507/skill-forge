import { NextResponse } from 'next/server';
import { initDb, getPinnedComparison, updatePinnedComparison, deletePinnedComparison } from '@/lib/db';

// GET /api/comparisons/[id] - Get a single pinned comparison
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const comparison = await getPinnedComparison(id);

    if (!comparison) {
      return NextResponse.json(
        { error: 'Pinned comparison not found' },
        { status: 404 }
      );
    }

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
    console.error('Failed to get pinned comparison:', error);
    return NextResponse.json(
      { error: 'Failed to get pinned comparison' },
      { status: 500 }
    );
  }
}

// PATCH /api/comparisons/[id] - Update a pinned comparison (rename)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    await updatePinnedComparison(id, body.name);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update pinned comparison:', error);
    return NextResponse.json(
      { error: 'Failed to update pinned comparison' },
      { status: 500 }
    );
  }
}

// DELETE /api/comparisons/[id] - Delete a pinned comparison
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDb();
    const { id } = await params;

    await deletePinnedComparison(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete pinned comparison:', error);
    return NextResponse.json(
      { error: 'Failed to delete pinned comparison' },
      { status: 500 }
    );
  }
}
