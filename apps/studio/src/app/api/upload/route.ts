import { NextResponse } from 'next/server';
import { writeFile, mkdir, readdir, unlink } from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const AUDIO_BASE_DIR = '/mnt/stuff/shortstory-audio';
const EPISODES_DIR = path.join(AUDIO_BASE_DIR, 'episodes');
const UPLOADS_DIR = path.join(AUDIO_BASE_DIR, 'uploads');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const type = (formData.get('type') as string) || 'audio'; // 'audio' | 'cover'
    const projectId = (formData.get('projectId') as string) || 'proj_default';
    const episodeNumber = formData.get('episodeNumber') ? Number(formData.get('episodeNumber')) : null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    await mkdir(EPISODES_DIR, { recursive: true });
    await mkdir(UPLOADS_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const originalExt = path.extname(file.name).toLowerCase() || (type === 'audio' ? '.mp3' : '.jpg');

    if (type === 'cover') {
      const coverFileName = `${projectId}_cover_${Date.now()}${originalExt}`;
      const targetPath = path.join(UPLOADS_DIR, coverFileName);
      await writeFile(targetPath, buffer);

      return NextResponse.json({
        success: true,
        type: 'cover',
        url: `/audio/uploads/${coverFileName}`,
        filename: coverFileName,
        size: buffer.length,
      });
    }

    // Audio upload with timestamp to avoid browser cache issues
    const timestamp = Date.now();
    const epNumStr = episodeNumber !== null ? `ep_${episodeNumber}` : `upload_${timestamp}`;
    const rawAudioFileName = `${projectId}_${epNumStr}_${timestamp}_raw${originalExt}`;
    const rawTargetPath = path.join(EPISODES_DIR, rawAudioFileName);
    await writeFile(rawTargetPath, buffer);

    // Standardize to clean 128k MP3 with unique timestamp
    const finalMp3Name = `${projectId}_${epNumStr}_${timestamp}.mp3`;
    const finalMp3Path = path.join(EPISODES_DIR, finalMp3Name);

    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-i',
        rawTargetPath,
        '-af',
        'aresample=44100,aformat=channel_layouts=stereo',
        '-c:a',
        'libmp3lame',
        '-b:a',
        '128k',
        finalMp3Path,
      ]);
    } catch {
      // If ffmpeg fails, fallback to keeping the raw uploaded file as target
      await writeFile(finalMp3Path, buffer);
    }

    // Clean up previous files for this episode and the raw upload file
    try {
      const existingFiles = await readdir(EPISODES_DIR);
      for (const f of existingFiles) {
        if (
          f.startsWith(`${projectId}_${epNumStr}`) &&
          f !== finalMp3Name
        ) {
          await unlink(path.join(EPISODES_DIR, f)).catch(() => {});
        }
      }
    } catch (cleanupErr) {
      console.warn('[Upload Cleanup] Warning:', cleanupErr);
    }

    // Calculate duration via ffprobe
    let durationSeconds = 0;
    try {
      const { stdout } = await execFileAsync('ffprobe', [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        finalMp3Path,
      ]);
      durationSeconds = Math.round(parseFloat(stdout.trim()) || 0);
    } catch {
      durationSeconds = 0;
    }

    return NextResponse.json({
      success: true,
      type: 'audio',
      url: `/audio/episodes/${finalMp3Name}`,
      durationSeconds,
      filename: finalMp3Name,
      size: buffer.length,
    });
  } catch (error: any) {
    console.error('[API /api/upload] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Falha ao processar upload do arquivo.' },
      { status: 500 }
    );
  }
}
