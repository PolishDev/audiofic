import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const AUDIO_BASE_DIR = fs.existsSync('/mnt/stuff/audiofic-audio')
  ? '/mnt/stuff/audiofic-audio'
  : '/mnt/stuff/shortstory-audio';
const UPLOAD_DIR = path.join(AUDIO_BASE_DIR, 'uploads');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const fileName = `${Date.now()}_${safeName}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    return NextResponse.json({
      success: true,
      filePath,
      fileName,
      url: `/audio/uploads/${fileName}`,
    });
  } catch (err: any) {
    console.error('[API /api/synthesize/upload] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Falha ao salvar áudio enviado.' },
      { status: 500 },
    );
  }
}
