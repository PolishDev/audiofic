#!/usr/bin/env python3
"""
AudioFic Studio - Multi-Track Audio Synthesizer & Mixing Pipeline
Supports:
1. Pure vocal synthesis (Kokoro-82M Local, Edge Multi-Voice, ElevenLabs) with 100% elimination
   of bracketed stage directions, sound descriptions (rain, tape k7, etc.), pauses, and speaker names.
2. Full multi-track DAW mixing (Voice, Ambience/Music, Foley SFX 1, Foley SFX 2) with custom volume,
   offsets, loop controls, and EBU R128 (-16 LUFS) normalization.
"""

import sys
import os
import json
import asyncio
import re
import subprocess
import shutil
import urllib.request
import urllib.error
import uuid

AUDIO_BASE_DIR = (
    '/mnt/stuff/audiofic-audio'
    if os.path.exists('/mnt/stuff/audiofic-audio')
    else '/mnt/stuff/shortstory-audio'
)
EPISODES_DIR = os.path.join(AUDIO_BASE_DIR, 'episodes')
AMB_DIR = os.path.join(AUDIO_BASE_DIR, 'ambience')
SFX_DIR = os.path.join(AUDIO_BASE_DIR, 'sfx')
UPLOAD_DIR = os.path.join(AUDIO_BASE_DIR, 'uploads')
TMP_DIR = os.path.join(AUDIO_BASE_DIR, 'tmp')

os.makedirs(EPISODES_DIR, exist_ok=True)
os.makedirs(AMB_DIR, exist_ok=True)
os.makedirs(SFX_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(TMP_DIR, exist_ok=True)

DEFAULT_CAST = {
    'kokoro': {
        'LUCAS': 'pm_alex',
        'HELENA': 'pf_dora',
        'ATENDENTE': 'pm_santa',
        'DONATO': 'pm_santa',
        'VALQUÍRIA': 'pf_dora',
        'NARRADOR': 'pm_alex',
    },
    'edge': {
        'LUCAS': {'voice': 'pt-BR-AntonioNeural', 'rate': '-4%', 'pitch': '-1Hz'},
        'HELENA': {'voice': 'pt-BR-FranciscaNeural', 'rate': '+0%', 'pitch': '+1Hz'},
        'ATENDENTE': {'voice': 'pt-BR-FabioNeural', 'rate': '-6%', 'pitch': '-2Hz'},
        'DONATO': {'voice': 'pt-BR-FabioNeural', 'rate': '-6%', 'pitch': '-2Hz'},
        'VALQUÍRIA': {'voice': 'pt-BR-ThalitaNeural', 'rate': '-2%', 'pitch': '+0Hz'},
        'NARRADOR': {'voice': 'pt-BR-AntonioNeural', 'rate': '-5%', 'pitch': '-2Hz'},
    },
    'elevenlabs': {
        'LUCAS': 'pNInz6obpgDQGcFmaJgB',      # Adam
        'HELENA': '21m00Tcm4TlvDq8ikWAM',     # Rachel
        'ATENDENTE': 'N2lVS1w4EtoT3dr4eOWO',  # Callum
        'DONATO': 'N2lVS1w4EtoT3dr4eOWO',     # Callum
        'VALQUÍRIA': 'MF3mGyEYCl7XYWbV9V6O',  # Elli
        'NARRADOR': 'VR6AewLTigWG4xSOukaG',   # Arnold
    },
    'gemini': {
        'LUCAS': 'Puck',
        'HELENA': 'Kore',
        'ATENDENTE': 'Fenrir',
        'DONATO': 'Fenrir',
        'VALQUÍRIA': 'Aoede',
        'NARRADOR': 'Charon',
    },
    'f5tts': {
        'LUCAS': '/mnt/stuff/shortstory-audio/voice_samples/lucas.wav',
        'HELENA': '/mnt/stuff/shortstory-audio/voice_samples/helena.wav',
        'ATENDENTE': '/mnt/stuff/shortstory-audio/voice_samples/donato.wav',
        'DONATO': '/mnt/stuff/shortstory-audio/voice_samples/donato.wav',
        'VALQUÍRIA': '/mnt/stuff/shortstory-audio/voice_samples/helena.wav',
        'NARRADOR': '/mnt/stuff/shortstory-audio/voice_samples/narrador.wav',
    },
    'xtts': {
        'LUCAS': '/mnt/stuff/shortstory-audio/voice_samples/lucas.wav',
        'HELENA': '/mnt/stuff/shortstory-audio/voice_samples/helena.wav',
        'ATENDENTE': '/mnt/stuff/shortstory-audio/voice_samples/donato.wav',
        'DONATO': '/mnt/stuff/shortstory-audio/voice_samples/donato.wav',
        'VALQUÍRIA': '/mnt/stuff/shortstory-audio/voice_samples/helena.wav',
        'NARRADOR': '/mnt/stuff/shortstory-audio/voice_samples/narrador.wav',
    }
}


def clean_pure_spoken_text(raw_script: str) -> list:
    """
    Strips ALL bracketed stage directions, sound effect cues, pause cues,
    and returns ONLY pure speech tuples: (speaker, text).
    Zero stage directions, zero sound cues, zero rain/tape descriptions!
    """
    # Remove all bracketed blocks completely across any number of newlines
    cleaned = re.sub(r'\[.*?\]', '', raw_script, flags=re.DOTALL)
    lines = cleaned.splitlines()

    segments = []
    current_speaker = 'NARRADOR'
    current_text = []

    for line in lines:
        line_str = line.strip()
        if not line_str:
            continue

        # Check if line is a speaker name (e.g. LUCAS, HELENA, ATENDENTE)
        clean_name = line_str.replace('—', '').replace('-', '').strip()
        if len(clean_name) <= 25 and clean_name.isupper() and not line_str.startswith('—') and not line_str.startswith('-'):
            if current_text:
                segments.append((current_speaker, ' '.join(current_text)))
                current_text = []
            current_speaker = clean_name
            if 'VALQU' in current_speaker:
                current_speaker = 'VALQUÍRIA'
            continue

        # Dialogue or narrative prose
        clean_line = re.sub(r'^[—\-\*]+\s*', '', line_str).strip()
        clean_line = re.sub(r'\[.*?\]', '', clean_line, flags=re.DOTALL).strip()
        if clean_line:
            current_text.append(clean_line)

    if current_text:
        segments.append((current_speaker, ' '.join(current_text)))

    merged_segments = []
    for spk, txt in segments:
        txt_clean = txt.strip()
        if not txt_clean:
            continue
        if merged_segments and merged_segments[-1][0] == spk:
            prev_spk, prev_txt = merged_segments[-1]
            merged_segments[-1] = (prev_spk, f"{prev_txt} {txt_clean}")
        else:
            merged_segments.append((spk, txt_clean))

    return merged_segments


def get_audio_duration(file_path: str) -> float:
    try:
        cmd = [
            'ffprobe', '-v', 'error',
            '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1',
            file_path
        ]
        out = subprocess.check_output(cmd, text=True).strip()
        return float(out)
    except Exception:
        return 0.0


_kokoro_pipeline = None

def synthesize_kokoro_pure(segments: list, output_mp3: str) -> float:
    """Generates 100% local multi-voice speech with Kokoro-82M on local GPU/CPU."""
    global _kokoro_pipeline
    import soundfile as sf
    import numpy as np
    from kokoro import KPipeline

    if _kokoro_pipeline is None:
        _kokoro_pipeline = KPipeline(lang_code='p', repo_id='hexgrad/Kokoro-82M')

    all_audio_chunks = []
    sample_rate = 24000

    for i, (speaker, text) in enumerate(segments):
        v = DEFAULT_CAST['kokoro'].get(speaker, 'pm_alex')
        generator = _kokoro_pipeline(text, voice=v, speed=0.95, split_pattern=r'\n+')
        chunk_list = []
        for _, _, audio in generator:
            chunk_list.append(audio)
        if chunk_list:
            spk_audio = np.concatenate(chunk_list)
            all_audio_chunks.append(spk_audio)
            # Add 0.45s breathing pause between speaker dialogue turns
            pause_silence = np.zeros(int(sample_rate * 0.45), dtype=np.float32)
            all_audio_chunks.append(pause_silence)

    if not all_audio_chunks:
        raise ValueError("Nenhum áudio gerado pelo Kokoro.")

    combined = np.concatenate(all_audio_chunks)
    wav_temp = output_mp3.replace('.mp3', '_temp.wav')
    sf.write(wav_temp, combined, sample_rate)

    subprocess.run([
        'ffmpeg', '-y', '-i', wav_temp,
        '-c:a', 'libmp3lame', '-b:a', '128k', output_mp3
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    if os.path.exists(wav_temp):
        os.remove(wav_temp)

    return len(combined) / sample_rate


async def synthesize_edge_pure(segments: list, output_mp3: str, session_tmp_dir: str) -> float:
    """Generates multi-voice speech with Edge-TTS."""
    import edge_tts

    concat_files = []
    for idx, (speaker, text) in enumerate(segments):
        chunk_path = os.path.join(session_tmp_dir, f"edge_{idx:03d}.mp3")
        cfg = DEFAULT_CAST['edge'].get(speaker, DEFAULT_CAST['edge']['NARRADOR'])
        
        saved = False
        last_err = None
        for attempt in range(4):
            try:
                voice = cfg['voice'] if attempt < 2 else 'pt-BR-AntonioNeural'
                rate = cfg['rate'] if attempt == 0 else '+0%'
                pitch = cfg['pitch'] if attempt == 0 else '+0Hz'
                comm = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
                await comm.save(chunk_path)
                if os.path.exists(chunk_path) and os.path.getsize(chunk_path) > 100:
                    saved = True
                    break
            except Exception as e:
                last_err = e
                await asyncio.sleep(1.0 * (attempt + 1))

        if not saved:
            print(f"[Edge-TTS Warning] Chunk {idx} ({speaker}) fallback placeholder: {last_err}", file=sys.stderr)
            subprocess.run([
                'ffmpeg', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
                '-t', '1.0', '-c:a', 'libmp3lame', '-b:a', '128k', chunk_path
            ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        # Standardize
        std_path = os.path.join(session_tmp_dir, f"edge_{idx:03d}_std.mp3")
        subprocess.run([
            'ffmpeg', '-y', '-i', chunk_path,
            '-af', 'aresample=44100,aformat=channel_layouts=mono',
            '-c:a', 'libmp3lame', '-b:a', '128k', std_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        concat_files.append(std_path)

        # 0.45s pause
        pause_path = os.path.join(session_tmp_dir, f"pause_{idx:03d}.mp3")
        subprocess.run([
            'ffmpeg', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
            '-t', '0.45', '-c:a', 'libmp3lame', '-b:a', '128k', pause_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        concat_files.append(pause_path)

    concat_txt = os.path.join(session_tmp_dir, "concat.txt")
    with open(concat_txt, "w") as f:
        for p in concat_files:
            f.write(f"file '{p}'\n")

    subprocess.run([
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', concat_txt,
        '-c', 'copy', output_mp3
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return get_audio_duration(output_mp3)


def synthesize_elevenlabs_pure(segments: list, eleven_key: str, output_mp3: str, session_tmp_dir: str) -> float:
    """Generates pure dialogue segments with ElevenLabs API."""
    concat_files = []
    for idx, (speaker, text) in enumerate(segments):
        chunk_path = os.path.join(session_tmp_dir, f"eleven_{idx:03d}.mp3")
        voice_id = DEFAULT_CAST['elevenlabs'].get(speaker, DEFAULT_CAST['elevenlabs']['NARRADOR'])

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        payload = {
            "text": text,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
        }
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url, data=data,
            headers={"xi-api-key": eleven_key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            with open(chunk_path, "wb") as f:
                f.write(resp.read())

        std_path = os.path.join(session_tmp_dir, f"eleven_{idx:03d}_std.mp3")
        subprocess.run([
            'ffmpeg', '-y', '-i', chunk_path,
            '-af', 'aresample=44100,aformat=channel_layouts=mono',
            '-c:a', 'libmp3lame', '-b:a', '128k', std_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        concat_files.append(std_path)

    concat_txt = os.path.join(session_tmp_dir, "concat.txt")
    with open(concat_txt, "w") as f:
        for p in concat_files:
            f.write(f"file '{p}'\n")

    subprocess.run([
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', concat_txt,
        '-c', 'copy', output_mp3
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return get_audio_duration(output_mp3)


def synthesize_gemini_pure(
    segments: list,
    gemini_key: str,
    output_mp3: str,
    session_tmp_dir: str,
    voice_cast: dict = None,
    voice_styles: dict = None
) -> float:
    """Generates ultra-realistic multi-voice speech with Gemini TTS."""
    import base64
    import time
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=gemini_key)
    concat_files = []

    models_to_try = [
        "gemini-3.8-flash-tts",
        "gemini-3.8-flash-lite-tts",
    ]
    cast_map = voice_cast or {}
    active_model = None

    for idx, (speaker, text) in enumerate(segments):
        chunk_wav = os.path.join(session_tmp_dir, f"gemini_{idx:03d}.wav")
        speaker_clean = speaker.strip().upper()

        # Find voice name from custom cast or defaults
        raw_voice = cast_map.get(speaker_clean) or cast_map.get(speaker)
        if not raw_voice:
            raw_voice = DEFAULT_CAST['gemini'].get(speaker_clean, DEFAULT_CAST['gemini']['NARRADOR'])

        voice_name = raw_voice.strip().capitalize() if raw_voice else 'Charon'

        audio_bytes = None
        last_err = None

        candidate_models = [active_model] if active_model else []
        for m in models_to_try:
            if m not in candidate_models:
                candidate_models.append(m)

        for model_name in candidate_models:
            for attempt in range(3):
                try:
                    config = types.GenerateContentConfig(
                        response_modalities=["AUDIO"],
                        speech_config=types.SpeechConfig(
                            voice_config=types.VoiceConfig(
                                prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                    voice_name=voice_name
                                )
                            )
                        )
                    )
                    response = client.models.generate_content(
                        model=model_name,
                        contents=text,
                        config=config
                    )
                    for candidate in getattr(response, 'candidates', []) or []:
                        content = getattr(candidate, 'content', None)
                        for part in getattr(content, 'parts', []) or []:
                            raw_data = getattr(part, 'inline_data', None)
                            if raw_data and getattr(raw_data, 'data', None):
                                d = raw_data.data
                                if isinstance(d, str):
                                    audio_bytes = base64.b64decode(d)
                                else:
                                    audio_bytes = d
                                break
                        if audio_bytes:
                            break
                    if audio_bytes:
                        active_model = model_name
                        break
                except Exception as e:
                    last_err = e
                    err_str = str(e)
                    # If daily quota limit is reached on this model, try next model immediately
                    if "429" in err_str and ("perday" in err_str.lower() or "limit: 10" in err_str or "limit: 0" in err_str):
                        break
                    # If per-minute rate limit, wait and retry
                    if "429" in err_str and attempt < 2:
                        wait_sec = 25
                        import re
                        m_delay = re.search(r'retry in ([0-9\.]+)s', err_str)
                        if m_delay:
                            try:
                                wait_sec = min(int(float(m_delay.group(1))) + 2, 45)
                            except Exception:
                                pass
                        time.sleep(wait_sec)
                        continue
                    break

            if audio_bytes:
                break

        if not audio_bytes:
            raise RuntimeError(f"Falha ao sintetizar trecho {idx} ({speaker}) com Gemini TTS: {last_err}")

        import wave
        if audio_bytes.startswith(b'RIFF'):
            with open(chunk_wav, "wb") as f:
                f.write(audio_bytes)
        else:
            with wave.open(chunk_wav, 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(24000)
                wf.writeframes(audio_bytes)

        std_path = os.path.join(session_tmp_dir, f"gemini_{idx:03d}_std.mp3")
        subprocess.run([
            'ffmpeg', '-y', '-i', chunk_wav,
            '-af', 'aresample=44100,aformat=channel_layouts=mono',
            '-c:a', 'libmp3lame', '-b:a', '128k', std_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        concat_files.append(std_path)

        # 0.45s breathing pause between dialogue turns
        pause_path = os.path.join(session_tmp_dir, f"gemini_pause_{idx:03d}.mp3")
        subprocess.run([
            'ffmpeg', '-y', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=mono',
            '-t', '0.45', '-c:a', 'libmp3lame', '-b:a', '128k', pause_path
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        concat_files.append(pause_path)

        # Light pacing between segments
        time.sleep(1.0)

    concat_txt = os.path.join(session_tmp_dir, "concat_gemini.txt")
    with open(concat_txt, "w") as f:
        for p in concat_files:
            f.write(f"file '{p}'\n")

    subprocess.run([
        'ffmpeg', '-y', '-f', 'concat', '-safe', '0', '-i', concat_txt,
        '-c', 'copy', output_mp3
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    return get_audio_duration(output_mp3)


def synthesize_f5tts_ptbr_pure(segments: list, output_mp3: str, session_tmp_dir: str, voice_cast: dict = None) -> float:
    """Generates 100% local multi-voice speech with fine-tuned Brazilian Portuguese F5-TTS on GPU."""
    runner = '/mnt/stuff/ai-tools/f5-tts/pt-br/run_f5_inference.py'
    python_bin = '/mnt/stuff/ai-tools/ComfyUI/.venv/bin/python'

    cfg = {
        'segments': segments,
        'output_mp3': output_mp3,
        'session_tmp_dir': session_tmp_dir,
        'voice_cast': voice_cast or {}
    }
    cfg_json = json.dumps(cfg)

    proc = subprocess.run([python_bin, runner, cfg_json], capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"F5-TTS execution failed: {proc.stderr[:400]}")

    lines = proc.stdout.strip().split('\n')
    json_line = next((l for l in reversed(lines) if l.strip().startswith('{') and l.strip().endswith('}')), None)
    if json_line:
        data = json.loads(json_line)
        return float(data.get('durationSeconds', get_audio_duration(output_mp3)))
    return get_audio_duration(output_mp3)


def synthesize_xtts_pure(segments: list, output_mp3: str, session_tmp_dir: str, voice_cast: dict = None) -> float:
    """Generates 100% local multi-voice speech with XTTS-v2 zero-shot voice cloning on GPU."""
    runner = '/mnt/stuff/ai-tools/tts_models/run_xtts_inference.py'
    python_bin = '/mnt/stuff/ai-tools/ComfyUI/.venv/bin/python'

    cfg = {
        'segments': segments,
        'output_mp3': output_mp3,
        'session_tmp_dir': session_tmp_dir,
        'voice_cast': voice_cast or {}
    }
    cfg_json = json.dumps(cfg)

    proc = subprocess.run([python_bin, runner, cfg_json], capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"XTTS execution failed: {proc.stderr[:400]}")

    lines = proc.stdout.strip().split('\n')
    json_line = next((l for l in reversed(lines) if l.strip().startswith('{') and l.strip().endswith('}')), None)
    if json_line:
        data = json.loads(json_line)
        return float(data.get('durationSeconds', get_audio_duration(output_mp3)))
    return get_audio_duration(output_mp3)


def mix_multitrack_to_master(
    voice_path: str,
    tracks: list,
    output_master_path: str
) -> float:
    """
    Takes voice_path and an array of track definitions:
    [
      { "id": "ambience", "file": "subgrave_40hz", "volume": 0.12, "muted": false, "loop": true, "offsetSec": 0 },
      { "id": "sfx1", "file": "fita_k7_click", "volume": 0.8, "muted": false, "position": "start", "offsetSec": 0 },
      { "id": "sfx2", "file": "fita_k7_click", "volume": 0.8, "muted": false, "position": "end", "offsetSec": 0 }
    ]
    Mixes everything with FFmpeg and applies EBU R128 (-16 LUFS) normalization.
    """
    voice_dur = get_audio_duration(voice_path)
    if voice_dur <= 0:
        voice_dur = 10.0

    inputs = ['-i', voice_path]
    filter_parts = []
    mix_inputs = ['[0:a]']
    input_idx = 1

    for tr in tracks:
        if tr.get('muted'):
            continue

        file_name = tr.get('file') or tr.get('filePath')
        if not file_name or file_name in ['nenhum', 'silencio', 'none']:
            continue

        # Resolve file path
        cand_path = None
        if os.path.isabs(file_name) and os.path.exists(file_name):
            cand_path = file_name
        else:
            # Check ambience, sfx, uploads
            for d in [AMB_DIR, SFX_DIR, UPLOAD_DIR]:
                for ext in ['', '.mp3', '.wav', '.ogg', '.flac', '.m4a']:
                    p = os.path.join(d, f"{file_name}{ext}")
                    if os.path.exists(p):
                        cand_path = p
                        break
                if cand_path:
                    break

        if not cand_path or not os.path.exists(cand_path):
            continue

        vol = max(0.01, min(1.0, float(tr.get('volume', 0.5))))
        tr_type = tr.get('type', 'sfx')
        is_loop = tr.get('loop', False)
        pos = tr.get('position', 'start')
        offset = float(tr.get('offsetSec', 0.0))

        if is_loop or tr_type == 'ambience':
            # Loop ambience to voice duration
            inputs.extend(['-stream_loop', '-1', '-i', cand_path])
            filter_parts.append(
                f"[{input_idx}:a]volume={vol},atrim=0:{voice_dur + 2},afade=t=out:st={voice_dur}:d=2[tr_{input_idx}]"
            )
        else:
            inputs.extend(['-i', cand_path])
            if pos == 'end':
                delay_ms = max(0, int((voice_dur - 1.5 + offset) * 1000))
            else:
                delay_ms = max(0, int(offset * 1000))

            if delay_ms > 0:
                filter_parts.append(f"[{input_idx}:a]volume={vol},adelay={delay_ms}|{delay_ms}[tr_{input_idx}]")
            else:
                filter_parts.append(f"[{input_idx}:a]volume={vol}[tr_{input_idx}]")

        mix_inputs.append(f"[tr_{input_idx}]")
        input_idx += 1

    if len(mix_inputs) > 1:
        mix_str = f"{''.join(mix_inputs)}amix=inputs={len(mix_inputs)}:duration=first:dropout_transition=2"
        full_filter = (';'.join(filter_parts) + ';' if filter_parts else '') + mix_str + ',loudnorm=I=-16:TP=-1.5:LRA=11[out]'
    else:
        full_filter = '[0:a]loudnorm=I=-16:TP=-1.5:LRA=11[out]'

    cmd = ['ffmpeg', '-y'] + inputs + [
        '-filter_complex', full_filter,
        '-map', '[out]',
        '-c:a', 'libmp3lame',
        '-b:a', '128k',
        output_master_path
    ]
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return get_audio_duration(output_master_path)


async def main():
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Configuração JSON necessária'}))
        sys.exit(1)

    raw_input = sys.argv[1]
    if raw_input.startswith('{'):
        config = json.loads(raw_input)
    else:
        with open(raw_input, 'r', encoding='utf-8') as f:
            config = json.load(f)

    project_id = config.get('projectId', 'proj_default')
    ep_num = config.get('episodeNumber', 1)
    action = config.get('action', 'full')  # 'voice_only' | 'mix_multitrack' | 'full'
    engine = config.get('engine', 'kokoro').lower()
    eleven_key = config.get('elevenLabsApiKey') or os.getenv('ELEVENLABS_API_KEY', '')
    gemini_key = config.get('geminiApiKey') or os.getenv('GEMINI_API_KEY', '')

    voice_path = os.path.join(EPISODES_DIR, f"{project_id}_ep_{ep_num}_voice.mp3")
    master_path = os.path.join(EPISODES_DIR, f"{project_id}_ep_{ep_num}.mp3")

    session_id = f"{project_id}_ep{ep_num}_{uuid.uuid4().hex[:8]}"
    session_tmp_dir = os.path.join(TMP_DIR, session_id)
    os.makedirs(session_tmp_dir, exist_ok=True)

    try:
        # ACTION 1: Generate Clean Voice Track Only
        if action in ['voice_only', 'full']:
            script_text = config.get('scriptText', '')
            if not script_text.strip():
                print(json.dumps({'error': 'Roteiro vazio'}))
                sys.exit(1)

            segments = clean_pure_spoken_text(script_text)
            if not segments:
                print(json.dumps({'error': 'Nenhuma fala encontrada no roteiro após limpeza.'}))
                sys.exit(1)

            done = False

            # 0. Try F5-TTS PT-BR (Local Brazilian Diffusion)
            if not done and engine in ['f5tts', 'f5-tts', 'f5']:
                try:
                    dur = synthesize_f5tts_ptbr_pure(segments, voice_path, session_tmp_dir, config.get('voiceCast', {}))
                    done = True
                except Exception as e:
                    print(f"[F5-TTS Fallback] {e}", file=sys.stderr)

            # 1. Try XTTS-v2 (Local Multi-Voice Voice Cloning)
            if not done and engine in ['xtts', 'xtts-v2', 'coqui']:
                try:
                    dur = synthesize_xtts_pure(segments, voice_path, session_tmp_dir, config.get('voiceCast', {}))
                    done = True
                except Exception as e:
                    print(f"[XTTS-v2 Fallback] {e}", file=sys.stderr)

            # 2. Try Gemini 3.8 Flash TTS
            if not done and engine == 'gemini' and gemini_key:
                try:
                    dur = synthesize_gemini_pure(
                        segments,
                        gemini_key,
                        voice_path,
                        session_tmp_dir,
                        voice_cast=config.get('voiceCast', {}),
                        voice_styles=config.get('voiceStyles', {})
                    )
                    done = True
                except Exception as e:
                    print(f"[Gemini TTS Fallback] {e}", file=sys.stderr)

            # 3. Try Kokoro (Local Fallback)
            if not done and engine == 'kokoro':
                try:
                    dur = synthesize_kokoro_pure(segments, voice_path)
                    done = True
                except Exception as e:
                    print(f"[Kokoro Fallback] {e}", file=sys.stderr)

            # 4. Try ElevenLabs
            if not done and (engine == 'elevenlabs' or (engine == 'gemini' and eleven_key)) and eleven_key:
                try:
                    dur = synthesize_elevenlabs_pure(segments, eleven_key, voice_path, session_tmp_dir)
                    done = True
                    engine = 'elevenlabs'
                except Exception as e:
                    print(f"[ElevenLabs Fallback] {e}", file=sys.stderr)

            # 5. Default / Fallback: Edge-TTS
            if not done:
                dur = await synthesize_edge_pure(segments, voice_path, session_tmp_dir)
                engine = 'edge'

            speakers = list(set(s[0] for s in segments))

            if action == 'voice_only':
                result = {
                    'success': True,
                    'action': 'voice_only',
                    'voiceUrl': f"/audio/episodes/{project_id}_ep_{ep_num}_voice.mp3",
                    'durationSeconds': round(dur),
                    'fileSize': os.path.getsize(voice_path) if os.path.exists(voice_path) else 0,
                    'engineUsed': engine,
                    'speakers': speakers,
                    'segmentsCount': len(segments)
                }
                print(json.dumps(result))
                return

        # ACTION 2: Mix Multi-Track DAW
        if action in ['mix_multitrack', 'full']:
            if not os.path.exists(voice_path):
                # Check fallback
                cand = os.path.join(EPISODES_DIR, 'kokoro_ep1_pure_voice.mp3')
                if os.path.exists(cand):
                    shutil.copy(cand, voice_path)
                else:
                    print(json.dumps({'error': 'Faixa de voz não encontrada. Gere a faixa de voz primeiro.'}))
                    sys.exit(1)

            tracks = config.get('tracks', [])
            if not tracks:
                # Default 4 tracks
                tracks = [
                    {'id': 'ambience', 'file': config.get('ambience', 'subgrave_40hz'), 'volume': float(config.get('ambienceVolume', 0.12)), 'loop': True},
                    {'id': 'sfx1', 'file': config.get('sfxStart', 'nenhum'), 'volume': 0.8, 'position': 'start'},
                    {'id': 'sfx2', 'file': config.get('sfxEnd', 'fita_k7_click'), 'volume': 0.8, 'position': 'end'}
                ]

            master_dur = mix_multitrack_to_master(voice_path, tracks, master_path)

            result = {
                'success': True,
                'action': action,
                'audioUrl': f"/audio/episodes/{project_id}_ep_{ep_num}.mp3",
                'voiceUrl': f"/audio/episodes/{project_id}_ep_{ep_num}_voice.mp3",
                'durationSeconds': round(master_dur),
                'fileSize': os.path.getsize(master_path) if os.path.exists(master_path) else 0,
                'tracksCount': len(tracks) + 1
            }
            print(json.dumps(result))

    finally:
        if os.path.exists(session_tmp_dir):
            shutil.rmtree(session_tmp_dir, ignore_errors=True)


if __name__ == '__main__':
    asyncio.run(main())
