import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      projectId = 'proj_default',
      episodeNumber = 1,
      action = 'full', // 'voice_only' | 'mix_multitrack' | 'full'
      scriptText = '',
      engine = 'kokoro',
      elevenLabsApiKey = process.env.ELEVENLABS_API_KEY || '',
      geminiApiKey = process.env.GEMINI_API_KEY || '',
      voiceCast = {},
      voiceStyles = {},
      voice = 'pt-BR-AntonioNeural',
      ambience = 'subgrave_40hz',
      ambienceVolume = 0.12,
      sfxStart = 'nenhum',
      sfxEnd = 'fita_k7_click',
      tracks = [],
    } = body;

    if (action !== 'mix_multitrack' && (!scriptText || !scriptText.trim())) {
      return NextResponse.json(
        { error: 'Roteiro vazio ou inválido para síntese de áudio.' },
        { status: 400 },
      );
    }

    const scriptPath = path.resolve(process.cwd(), 'src/scripts/synthesizer.py');
    const uvPath = '/home/alves/.local/bin/uv';

    const config = JSON.stringify({
      projectId,
      episodeNumber,
      action,
      scriptText,
      engine,
      elevenLabsApiKey,
      geminiApiKey,
      voiceCast,
      voiceStyles,
      voice,
      ambience,
      ambienceVolume,
      sfxStart,
      sfxEnd,
      tracks,
    });

    const uvArgs = ['run'];
    if (engine === 'gemini') {
      uvArgs.push(
        '--with',
        'google-genai>=2.25.0',
        '--with',
        'edge-tts',
      );
    } else if (engine === 'kokoro') {
      uvArgs.push(
        '--with',
        'kokoro>=0.9.2',
        '--with',
        'soundfile',
        '--with',
        'torch',
        '--with',
        'edge-tts',
      );
    } else {
      uvArgs.push('--with', 'edge-tts');
    }
    uvArgs.push(scriptPath, config);

    const { stdout, stderr } = await execFileAsync(
      uvPath,
      uvArgs,
      { maxBuffer: 25 * 1024 * 1024, timeout: 600000 },
    );

    let parsedResult;
    try {
      const lines = stdout.trim().split('\n');
      const jsonLine = lines.reverse().find(
        (l) => l.trim().startsWith('{') && l.trim().endsWith('}'),
      );
      if (jsonLine) {
        parsedResult = JSON.parse(jsonLine.trim());
      } else {
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Nenhum JSON retornado pelo script.');
        }
      }
    } catch {
      console.error('[API Synthesize] Python raw output:', stdout, stderr);
      return NextResponse.json(
        { error: 'Falha ao processar saída do sintetizador de áudio.' },
        { status: 500 },
      );
    }

    if (!parsedResult.success) {
      return NextResponse.json(
        { error: parsedResult.error || 'Erro na síntese de áudio.' },
        { status: 500 },
      );
    }

    return NextResponse.json(parsedResult);
  } catch (err: any) {
    console.error('[API /api/synthesize/episode] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Erro inesperado na geração do áudio.' },
      { status: 500 },
    );
  }
}
