import { NextResponse } from 'next/server';
import { getLocalOllamaModels } from '@/lib/ollama';

export async function GET(req: Request) {
  // Accessing req forces runtime dynamic evaluation
  const _url = req.url;
  const models = await getLocalOllamaModels();
  return NextResponse.json({
    online: models.length > 0,
    models,
  });
}
