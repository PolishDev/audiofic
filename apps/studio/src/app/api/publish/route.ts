import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const ADMIN_API_KEY =
  process.env.ADMIN_API_KEY || 'audiofic-dev-admin-key';

export async function POST(req: Request) {
  try {
    const storyPayload = await req.json();

    const res = await fetch(`${BACKEND_URL}/admin/stories/bulk-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': ADMIN_API_KEY,
      },
      body: JSON.stringify(storyPayload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { error: `Backend error (${res.status}): ${errorText}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json({ success: true, publishedStory: data });
  } catch (error) {
    console.error('[API /publish] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Falha ao conectar com o backend NestJS',
      },
      { status: 500 },
    );
  }
}
