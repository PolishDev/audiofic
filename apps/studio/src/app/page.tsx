'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Plus,
  BookOpen,
  Volume2,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  ArrowRight,
  Headphones,
  Settings,
  Layers,
  ScrollText,
  User,
  Compass,
  Flame,
  FileEdit,
  RefreshCw,
  Clock,
  Mic,
  Disc3,
  Sliders,
  ChevronRight,
  Trash2,
  Music,
  Upload,
  Download,
  VolumeX,
  Copy,
  ExternalLink,
  Lock,
  Unlock,
  Image as ImageIcon,
  FileAudio,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Types for the Show Bible Architecture
export interface Character {
  name: string;
  role: string;
  personality: string;
  secret: string;
  voiceProfile?: string;
  geminiVoice?: string;
  voiceStyle?: string;
}

export interface Setting {
  name: string;
  sensoryDescription: string;
}

export interface EpisodeOutline {
  episodeNumber: number;
  title: string;
  premise: string;
  turningPoint: string;
  cliffhanger: string;
}

export interface ShowBible {
  title: string;
  logline: string;
  synopsis: string;
  genre: string;
  tone: string;
  coverUrl?: string;
  characters: Character[];
  settings: Setting[];
  universeRules: string[];
  episodeOutlines: EpisodeOutline[];
  narratorVoice?: string;
  narratorStyle?: string;
}

export const GEMINI_POPULAR_VOICES = [
  { name: 'Koda', category: 'Commercial Voiceover', desc: 'Direto, firme e profissional · Pitch médio-baixo' },
  { name: 'Bodi', category: 'Tutor / Íntimo', desc: 'Sussurrado, calmo e intimista · Pitch baixo' },
  { name: 'Lumi', category: 'Tutor / Conversacional', desc: 'Caloroso, empático e acolhedor · Pitch baixo' },
  { name: 'Nika', category: 'Commercial Voiceover', desc: 'Nítido, envolvente e natural · Pitch médio' },
  { name: 'Tavi', category: 'Commercial Voiceover', desc: 'Suave, intimista e focado · Pitch médio-alto' },
  { name: 'Kira', category: 'Instructional', desc: 'Confiante, fria e analítica · Pitch médio' },
  { name: 'Sola', category: 'Tutor / Delicado', desc: 'Gentil, relaxado e suave · Pitch alto' },
  { name: 'Charon', category: 'Ficção / Sombrio', desc: 'Grave, profundo e cinematográfico · Ideal para Narrador' },
  { name: 'Puck', category: 'Ficção / Jovem', desc: 'Expressivo, agitado e dramático · Ideal para Protagonista' },
  { name: 'Kore', category: 'Ficção / Calma', desc: 'Investigativa, reflexiva e serena · Ideal para Protagonista Feminina' },
  { name: 'Fenrir', category: 'Ficção / Tensão', desc: 'Áspero, ameaçador e autoritário · Ideal para Vilão / Antagonista' },
  { name: 'Aoede', category: 'Ficção / Drama', desc: 'Melodiosa, profunda e emotiva · Ideal para Coadjuvante' },
];

export const VOICE_STYLE_PRESETS = [
  { label: '🤫 Sussurrado & Íntimo', value: 'Sussurrado, íntimo, respiração próxima ao microfone com tensão sutil' },
  { label: '🕵️ Grave & Investigativo', value: 'Grave, ritmo analítico, pausas deliberadas, tom frio de detetive' },
  { label: '😰 Tenso & Paranóico', value: 'Tenso, nervoso, respiração ligeiramente acelerada com senso de urgência' },
  { label: '🧊 Frio & Intimidador', value: 'Frio, seco, cadência pausada sem demonstrar emoção, tom ameaçador' },
  { label: '📻 Narrador Cinematográfico', value: 'Voz profunda, solene, pausas dramáticas de suspense e dicção impecável' },
  { label: '🎙️ Caloroso & Acolhedor', value: 'Caloroso, empático, tom acessível e expressivo' },
  { label: '⚠️ Conflito & Raiva Contida', value: 'Voz ríspida, dentes cerrados, intensidade dramática e autoridade' },
];

export interface GeneratedEpisodeScript {
  episodeNumber: number;
  title: string;
  synopsis: string;
  estimatedDuration?: string;
  durationSeconds?: number;
  wordCount?: number;
  fullScript: string;
  audioUrl?: string;
  voiceUrl?: string;
  isPremium?: boolean;
}

export interface StudioProject {
  id: string;
  title: string;
  genre: string;
  time: string;
  updatedAt: number;
  prompt?: string;
  episodesCount?: number;
  coverUrl?: string;
  bible: ShowBible;
  scripts: Record<number, GeneratedEpisodeScript>;
  activeStep?: 'bible' | 'outlines' | 'scripts' | 'audio' | 'publish';
  activeEpisodeIdx?: number;
}

const DEFAULT_GENRES = [
  { id: 'terror-sobrenatural', label: 'Terror Sobrenatural' },
  { id: 'suspense-psicologico', label: 'Suspense Psicológico' },
  { id: 'lendas-folclore', label: 'Lendas & Folclore' },
  { id: 'misterio-investigativo', label: 'Mistério Investigativo' },
  { id: 'horror-cosmico', label: 'Horror Cósmico' },
];

export default function StudioPage() {
  const [ollamaOnline, setOllamaOnline] = useState<boolean>(true);
  const [models, setModels] = useState<string[]>(['qwen2.5:7b', 'llama3.2:latest']);
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5:7b');

  // Step 1: Bible Creation form
  const [prompt, setPrompt] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('terror-sobrenatural');
  const [episodesCount, setEpisodesCount] = useState(3);
  const [isGeneratingBible, setIsGeneratingBible] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Show Bible state
  const [bible, setBible] = useState<ShowBible | null>(null);

  // Active step / tab in Director Workflow
  const [activeStep, setActiveStep] = useState<'bible' | 'outlines' | 'scripts' | 'audio' | 'publish'>('bible');

  // Step 2 & 3: Episode Scriptwriting State
  const [activeEpisodeIdx, setActiveEpisodeIdx] = useState(0);
  const [directorNotes, setDirectorNotes] = useState<string>('');
  const [targetDuration, setTargetDuration] = useState<number>(10); // 10 min default
  const [isWritingScript, setIsWritingScript] = useState(false);
  const [scripts, setScripts] = useState<Record<number, GeneratedEpisodeScript>>({});

  // Audio Studio & Multi-Track DAW Editor State
  const [audioEpIdx, setAudioEpIdx] = useState<number>(0);
  const [ttsEngine, setTtsEngine] = useState<'gemini' | 'f5tts' | 'xtts' | 'kokoro' | 'elevenlabs' | 'edge'>('gemini');
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string>('');
  const [voiceCast, setVoiceCast] = useState<Record<string, string>>({
    LUCAS: 'Koda',
    HELENA: 'Kore',
    NARRADOR: 'Charon',
    ATENDENTE: 'Bodi',
    DONATO: 'Fenrir',
    VALQUÍRIA: 'Aoede',
  });
  const [voiceStyles, setVoiceStyles] = useState<Record<string, string>>({
    LUCAS: 'Grave, ritmo analítico, pausas deliberadas, tom frio de detetive',
    HELENA: 'Tensa, nervosa, respiração ligeiramente acelerada com senso de urgência',
    NARRADOR: 'Voz profunda, solene, pausas dramáticas de suspense e dicção impecável',
    ATENDENTE: 'Sussurrado, íntimo, respiração próxima ao microfone com tensão sutil',
    DONATO: 'Frio, seco, cadência pausada sem demonstrar emoção, tom ameaçador',
    VALQUÍRIA: 'Melodiosa, profunda e emotiva com mistério',
  });
  const [lastRenderStats, setLastRenderStats] = useState<{
    engineUsed?: string;
    speakers?: string[];
    eventsCount?: number;
    speechSegments?: number;
    sfxInserted?: number;
    pausesInserted?: number;
  } | null>(null);

  // Multi-Track DAW Tracks State
  const [trackVoiceVol, setTrackVoiceVol] = useState<number>(1.0);
  const [trackVoiceMuted, setTrackVoiceMuted] = useState<boolean>(false);
  const [trackVoiceSolo, setTrackVoiceSolo] = useState<boolean>(false);

  const [trackAmbienceFile, setTrackAmbienceFile] = useState<string>('subgrave_40hz');
  const [trackAmbienceVol, setTrackAmbienceVol] = useState<number>(0.12);
  const [trackAmbienceMuted, setTrackAmbienceMuted] = useState<boolean>(false);
  const [trackAmbienceSolo, setTrackAmbienceSolo] = useState<boolean>(false);
  const [trackAmbienceLoop, setTrackAmbienceLoop] = useState<boolean>(true);

  const [trackSfx1File, setTrackSfx1File] = useState<string>('fita_k7_click');
  const [trackSfx1Vol, setTrackSfx1Vol] = useState<number>(0.8);
  const [trackSfx1Pos, setTrackSfx1Pos] = useState<'start' | 'end' | 'custom'>('start');
  const [trackSfx1Offset, setTrackSfx1Offset] = useState<number>(0);
  const [trackSfx1Muted, setTrackSfx1Muted] = useState<boolean>(false);

  const [trackSfx2File, setTrackSfx2File] = useState<string>('fita_k7_click');
  const [trackSfx2Vol, setTrackSfx2Vol] = useState<number>(0.8);
  const [trackSfx2Pos, setTrackSfx2Pos] = useState<'start' | 'end' | 'custom'>('end');
  const [trackSfx2Offset, setTrackSfx2Offset] = useState<number>(0);
  const [trackSfx2Muted, setTrackSfx2Muted] = useState<boolean>(false);

  const [selectedVoice, setSelectedVoice] = useState<string>('pt-BR-AntonioNeural');
  const [selectedAmbience, setSelectedAmbience] = useState<string>('subgrave_40hz');
  const [ambienceVolume, setAmbienceVolume] = useState<number>(0.12);
  const [sfxStart, setSfxStart] = useState<string>('nenhum');
  const [sfxEnd, setSfxEnd] = useState<string>('fita_k7_click');
  const [customTracks, setCustomTracks] = useState<Array<{ name: string; path: string; url: string }>>([]);
  const [isSynthesizingSingle, setIsSynthesizingSingle] = useState(false);
  const [isGeneratingVoiceOnly, setIsGeneratingVoiceOnly] = useState(false);
  const [isMixingMultiTrack, setIsMixingMultiTrack] = useState(false);
  const [isSynthesizingAll, setIsSynthesizingAll] = useState(false);
  const [audioBatchProgress, setAudioBatchProgress] = useState<{ current: number; total: number; title: string } | null>(null);

  // Player state
  const audioPlayerRef = React.useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Publishing State
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);

  // AI Provider & Cloud Settings
  const [aiProvider, setAiProvider] = useState<'ollama' | 'gemini' | 'nvidia'>('ollama');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [nvidiaApiKey, setNvidiaApiKey] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Bulk Generation State
  const [isBulkWriting, setIsBulkWriting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{
    currentEp: number;
    totalEps: number;
    status: string;
  } | null>(null);
  const isBulkCancelledRef = React.useRef(false);

  // Project persistence states
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [savedProjects, setSavedProjects] = useState<StudioProject[]>([]);

  // Production: Audio & Cover Management States
  const [copiedScriptEp, setCopiedScriptEp] = useState<number | null>(null);
  const [uploadingAudioEp, setUploadingAudioEp] = useState<number | null>(null);
  const [uploadedSuccessEp, setUploadedSuccessEp] = useState<number | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);

  // Function to load a specific project
  const loadProject = (p: StudioProject) => {
    setCurrentProjectId(p.id);
    setBible(p.bible);
    setScripts(p.scripts || {});
    if (p.genre) setSelectedGenre(p.genre);
    if (p.prompt) setPrompt(p.prompt);
    if (p.episodesCount) setEpisodesCount(p.episodesCount);
    if (p.activeStep) setActiveStep(p.activeStep);
    if (typeof p.activeEpisodeIdx === 'number') setActiveEpisodeIdx(p.activeEpisodeIdx);

    // Sync character voices & styles from Bible
    if (p.bible) {
      const cast: Record<string, string> = {};
      const styles: Record<string, string> = {};
      if (p.bible.narratorVoice) cast['NARRADOR'] = p.bible.narratorVoice;
      if (p.bible.narratorStyle) styles['NARRADOR'] = p.bible.narratorStyle;
      p.bible.characters?.forEach((c) => {
        if (c.geminiVoice) cast[c.name.toUpperCase()] = c.geminiVoice;
        if (c.voiceStyle) styles[c.name.toUpperCase()] = c.voiceStyle;
      });
      if (Object.keys(cast).length > 0) setVoiceCast((prev) => ({ ...prev, ...cast }));
      if (Object.keys(styles).length > 0) setVoiceStyles((prev) => ({ ...prev, ...styles }));
    }

    setErrorMsg(null);
    setPublishSuccess(null);
    try {
      localStorage.setItem('shortstory_studio_active_id_v1', p.id);
    } catch {}
  };

  // Helpers to update character voices & styles in the Show Bible
  const handleUpdateCharacterVoice = (charIdx: number, geminiVoice: string) => {
    if (!bible) return;
    const updatedChars = [...bible.characters];
    updatedChars[charIdx] = { ...updatedChars[charIdx], geminiVoice };
    const updatedBible = { ...bible, characters: updatedChars };
    setBible(updatedBible);
    const charName = updatedChars[charIdx].name.toUpperCase();
    const newCast = { ...voiceCast, [charName]: geminiVoice };
    setVoiceCast(newCast);
    try {
      localStorage.setItem('shortstory_voice_cast', JSON.stringify(newCast));
    } catch {}
    if (currentProjectId) {
      const p = savedProjects.find((x) => x.id === currentProjectId);
      if (p) persistProject({ ...p, bible: updatedBible, updatedAt: Date.now() });
    }
  };

  const handleUpdateCharacterStyle = (charIdx: number, voiceStyle: string) => {
    if (!bible) return;
    const updatedChars = [...bible.characters];
    updatedChars[charIdx] = { ...updatedChars[charIdx], voiceStyle };
    const updatedBible = { ...bible, characters: updatedChars };
    setBible(updatedBible);
    const charName = updatedChars[charIdx].name.toUpperCase();
    const newStyles = { ...voiceStyles, [charName]: voiceStyle };
    setVoiceStyles(newStyles);
    try {
      localStorage.setItem('shortstory_voice_styles', JSON.stringify(newStyles));
    } catch {}
    if (currentProjectId) {
      const p = savedProjects.find((x) => x.id === currentProjectId);
      if (p) persistProject({ ...p, bible: updatedBible, updatedAt: Date.now() });
    }
  };

  const handleUpdateNarratorVoice = (narratorVoice: string, narratorStyle?: string) => {
    if (!bible) return;
    const effectiveStyle = narratorStyle !== undefined ? narratorStyle : (bible.narratorStyle || voiceStyles['NARRADOR'] || 'Voz profunda, solene, pausas dramáticas de suspense e dicção impecável');
    const updatedBible = {
      ...bible,
      narratorVoice,
      narratorStyle: effectiveStyle,
    };
    setBible(updatedBible);
    const newCast = { ...voiceCast, NARRADOR: narratorVoice };
    setVoiceCast(newCast);
    try {
      localStorage.setItem('shortstory_voice_cast', JSON.stringify(newCast));
    } catch {}
    if (narratorStyle !== undefined) {
      const newStyles = { ...voiceStyles, NARRADOR: narratorStyle };
      setVoiceStyles(newStyles);
      try {
        localStorage.setItem('shortstory_voice_styles', JSON.stringify(newStyles));
      } catch {}
    }
    if (currentProjectId) {
      const p = savedProjects.find((x) => x.id === currentProjectId);
      if (p) persistProject({ ...p, bible: updatedBible, updatedAt: Date.now() });
    }
  };

  // Helper to persist project in localStorage and disk
  const persistProject = async (project: StudioProject) => {
    // 1. Update React state
    setSavedProjects((prev) => {
      const existingIdx = prev.findIndex((p) => p.id === project.id);
      let next: StudioProject[];
      if (existingIdx >= 0) {
        next = [...prev];
        next[existingIdx] = project;
      } else {
        next = [project, ...prev];
      }
      return next.slice(0, 50);
    });

    // 2. LocalStorage for instant refresh on F5
    try {
      const localData = localStorage.getItem('shortstory_studio_projects_v1');
      let list: StudioProject[] = localData ? JSON.parse(localData) : [];
      const idx = list.findIndex((p) => p.id === project.id);
      if (idx >= 0) {
        list[idx] = project;
      } else {
        list.unshift(project);
      }
      localStorage.setItem('shortstory_studio_projects_v1', JSON.stringify(list.slice(0, 50)));
      localStorage.setItem('shortstory_studio_active_id_v1', project.id);
    } catch (e) {
      console.warn('[LocalStorage] save error:', e);
    }

    // 3. Disk API for permanent storage
    try {
      await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
    } catch (e) {
      console.warn('[API /projects] save error:', e);
    }
  };

  // Delete project
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const localData = localStorage.getItem('shortstory_studio_projects_v1');
      if (localData) {
        const list: StudioProject[] = JSON.parse(localData);
        localStorage.setItem(
          'shortstory_studio_projects_v1',
          JSON.stringify(list.filter((p) => p.id !== id)),
        );
      }
    } catch {}

    try {
      await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
    } catch {}

    if (currentProjectId === id) {
      setCurrentProjectId(null);
      setBible(null);
      setScripts({});
      setPrompt('');
      try {
        localStorage.removeItem('shortstory_studio_active_id_v1');
      } catch {}
    }
  };

  // Clean script text for pasting into Google AI Studio (removes [stage directions/SFX], leaves pure spoken dialogue)
  const cleanScriptForAIStudio = (raw: string): string => {
    return raw
      .replace(/\[[\s\S]*?\]/g, '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join('\n\n');
  };

  const handleCopyCleanScript = (epNum: number) => {
    const script = scripts[epNum]?.fullScript;
    if (!script) return;
    const cleaned = cleanScriptForAIStudio(script);
    navigator.clipboard.writeText(cleaned);
    setCopiedScriptEp(epNum);
    setTimeout(() => setCopiedScriptEp(null), 3000);
  };

  const handleUploadAudio = async (epNum: number, file: File) => {
    if (!currentProjectId || !bible) return;
    setUploadingAudioEp(epNum);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'audio');
      formData.append('projectId', currentProjectId);
      formData.append('episodeNumber', epNum.toString());

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao enviar arquivo de áudio.');
      }

      const currentScript = scripts[epNum] || {
        episodeNumber: epNum,
        title: bible.episodeOutlines.find((e) => e.episodeNumber === epNum)?.title || `Episódio ${epNum}`,
        synopsis: bible.episodeOutlines.find((e) => e.episodeNumber === epNum)?.premise || '',
        fullScript: '',
      };

      const updatedScripts = {
        ...scripts,
        [epNum]: {
          ...currentScript,
          audioUrl: data.url,
          voiceUrl: data.url,
          durationSeconds: data.durationSeconds,
          estimatedDuration: `${Math.round(data.durationSeconds / 60)} min`,
          isPremium: currentScript.isPremium !== undefined ? currentScript.isPremium : epNum > 1,
        },
      };

      setScripts(updatedScripts);
      setUploadedSuccessEp(epNum);
      setTimeout(() => setUploadedSuccessEp(null), 5000);

      persistProject({
        id: currentProjectId,
        title: bible.title,
        genre: selectedGenre,
        time: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        updatedAt: Date.now(),
        prompt,
        episodesCount: bible.episodeOutlines.length,
        bible,
        scripts: updatedScripts,
        activeStep: 'audio',
        activeEpisodeIdx,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro no upload de áudio.');
    } finally {
      setUploadingAudioEp(null);
    }
  };

  const handleUploadCover = async (file: File) => {
    if (!currentProjectId || !bible) return;
    setIsUploadingCover(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'cover');
      formData.append('projectId', currentProjectId);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha no upload da capa.');
      }

      const updatedBible: ShowBible = {
        ...bible,
        coverUrl: data.url,
      };

      setBible(updatedBible);

      persistProject({
        id: currentProjectId,
        title: updatedBible.title,
        genre: selectedGenre,
        time: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        updatedAt: Date.now(),
        prompt,
        episodesCount: updatedBible.episodeOutlines.length,
        bible: updatedBible,
        scripts,
        activeStep,
        activeEpisodeIdx,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro no upload da capa.');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleUpdateCoverUrl = (url: string) => {
    if (!bible || !currentProjectId) return;
    const updatedBible: ShowBible = {
      ...bible,
      coverUrl: url,
    };
    setBible(updatedBible);
    persistProject({
      id: currentProjectId,
      title: updatedBible.title,
      genre: selectedGenre,
      time: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      updatedAt: Date.now(),
      prompt,
      episodesCount: updatedBible.episodeOutlines.length,
      bible: updatedBible,
      scripts,
      activeStep,
      activeEpisodeIdx,
    });
  };

  const handleTogglePremium = (epNum: number) => {
    if (!bible || !currentProjectId) return;
    const currentScript = scripts[epNum] || {
      episodeNumber: epNum,
      title: bible.episodeOutlines.find((e) => e.episodeNumber === epNum)?.title || `Episódio ${epNum}`,
      synopsis: bible.episodeOutlines.find((e) => e.episodeNumber === epNum)?.premise || '',
      fullScript: '',
      isPremium: epNum > 1,
    };

    const nextIsPremium = currentScript.isPremium !== undefined ? !currentScript.isPremium : epNum === 1;

    const updatedScripts = {
      ...scripts,
      [epNum]: {
        ...currentScript,
        isPremium: nextIsPremium,
      },
    };

    setScripts(updatedScripts);

    persistProject({
      id: currentProjectId,
      title: bible.title,
      genre: selectedGenre,
      time: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      updatedAt: Date.now(),
      prompt,
      episodesCount: bible.episodeOutlines.length,
      bible,
      scripts: updatedScripts,
      activeStep,
      activeEpisodeIdx,
    });
  };

  // Load from LocalStorage immediately on mount, then sync with disk
  useEffect(() => {
    let activeId: string | null = null;
    try {
      const savedProvider = localStorage.getItem('shortstory_ai_provider') as
        | 'ollama'
        | 'gemini'
        | 'nvidia';
      if (savedProvider) setAiProvider(savedProvider);
      const savedGemini = localStorage.getItem('shortstory_gemini_key');
      if (savedGemini) setGeminiApiKey(savedGemini);
      const savedNvidia = localStorage.getItem('shortstory_nvidia_key');
      if (savedNvidia) setNvidiaApiKey(savedNvidia);
      const savedEleven = localStorage.getItem('shortstory_elevenlabs_key');
      if (savedEleven) {
        setElevenLabsApiKey(savedEleven);
      }
      const savedTtsEngine = localStorage.getItem('shortstory_tts_engine') as 'f5tts' | 'xtts' | 'gemini' | 'elevenlabs' | 'kokoro' | 'edge';
      if (savedTtsEngine) setTtsEngine(savedTtsEngine);
      const savedCast = localStorage.getItem('shortstory_voice_cast');
      if (savedCast) {
        try {
          setVoiceCast((prev) => ({ ...prev, ...JSON.parse(savedCast) }));
        } catch {}
      }
      const savedModel = localStorage.getItem('shortstory_selected_model');
      if (savedModel) {
        const effectiveModel =
          savedModel.includes('2.5') || savedModel.includes('1.5') || savedModel.includes('2.0')
            ? 'gemini-3.8-flash'
            : savedModel;
        setSelectedModel(effectiveModel);
        if (effectiveModel.startsWith('gemini')) setAiProvider('gemini');
      }

      activeId = localStorage.getItem('shortstory_studio_active_id_v1');
      const localData = localStorage.getItem('shortstory_studio_projects_v1');
      if (localData) {
        const parsed: StudioProject[] = JSON.parse(localData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedProjects(parsed);
          const target = (activeId && parsed.find((p) => p.id === activeId)) || parsed[0];
          loadProject(target);
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] load error:', e);
    }

    async function syncDiskProjects() {
      try {
        const res = await fetch('/api/projects');
        if (res.ok) {
          const data = await res.json();
          if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
            setSavedProjects(data.projects);
            localStorage.setItem(
              'shortstory_studio_projects_v1',
              JSON.stringify(data.projects),
            );
            if (!activeId) {
              loadProject(data.projects[0]);
            }
          }
        }
      } catch (e) {
        console.warn('[API /projects] sync error:', e);
      }
    }
    syncDiskProjects();
  }, []);

  // Check Ollama models on mount
  useEffect(() => {
    async function checkOllama() {
      try {
        const res = await fetch('/api/ollama/models');
        if (res.ok) {
          const data = await res.json();
          setOllamaOnline(data.online);
          if (data.models && data.models.length > 0) {
            const names = data.models.map((m: { name: string }) => m.name);
            setModels(names);
            const savedModel = localStorage.getItem('shortstory_selected_model');
            if (!savedModel) {
              if (names.includes('qwen2.5:7b')) {
                setSelectedModel('qwen2.5:7b');
              } else {
                setSelectedModel(names[0]);
              }
            }
          }
        }
      } catch {
        setOllamaOnline(false);
      }
    }
    checkOllama();
  }, []);

  // 1. Generate Show Bible
  const handleGenerateBible = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGeneratingBible) return;

    setIsGeneratingBible(true);
    setErrorMsg(null);
    const isGemini = selectedModel.startsWith('gemini') || aiProvider === 'gemini';
    if (isGemini && !geminiApiKey) {
      setShowSettingsModal(true);
      setErrorMsg(
        'Por favor, insira sua chave de API do Gemini nas configurações para gerar com o Gemini.',
      );
      setIsGeneratingBible(false);
      return;
    }

    try {
      const res = await fetch('/api/generate/bible', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          genre: selectedGenre,
          episodesCount,
          provider: isGemini ? 'gemini' : aiProvider,
          model: selectedModel,
          apiKey: isGemini ? geminiApiKey : nvidiaApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao gerar Bíblia da Série');
      }

      const generatedBible = data.bible as ShowBible;

      // Auto-assign default Gemini voices and acting styles to characters
      const initialVoices: Record<string, string> = { NARRADOR: 'Charon' };
      const initialStyles: Record<string, string> = {
        NARRADOR: 'Voz profunda, solene, pausas dramáticas de suspense e dicção impecável',
      };
      generatedBible.narratorVoice = 'Charon';
      generatedBible.narratorStyle = 'Voz profunda, solene, pausas dramáticas de suspense e dicção impecável';

      generatedBible.characters = (generatedBible.characters || []).map((c, idx) => {
        let v = c.geminiVoice;
        let s = c.voiceStyle;
        if (!v) {
          const roleLower = (c.role || '').toLowerCase();
          if (roleLower.includes('protagonista') || idx === 0) v = 'Koda';
          else if (roleLower.includes('investigador') || roleLower.includes('detetive')) v = 'Bodi';
          else if (roleLower.includes('antagonista') || roleLower.includes('vilão') || roleLower.includes('suspeito')) v = 'Fenrir';
          else if (roleLower.includes('esposa') || roleLower.includes('mulher') || roleLower.includes('médica') || roleLower.includes('amiga')) v = 'Kore';
          else v = idx % 2 === 0 ? 'Tavi' : 'Nika';
        }
        if (!s) {
          s = 'Grave, ritmo analítico, pausas deliberadas, tom de suspense e dicção nítida';
        }
        initialVoices[c.name.toUpperCase()] = v;
        initialStyles[c.name.toUpperCase()] = s;
        return { ...c, geminiVoice: v, voiceStyle: s };
      });

      setVoiceCast((prev) => ({ ...prev, ...initialVoices }));
      setVoiceStyles((prev) => ({ ...prev, ...initialStyles }));
      try {
        localStorage.setItem('shortstory_voice_cast', JSON.stringify(initialVoices));
        localStorage.setItem('shortstory_voice_styles', JSON.stringify(initialStyles));
      } catch {}

      const newId = `proj_${Date.now()}`;
      const nowFormatted = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const newProject: StudioProject = {
        id: newId,
        title: generatedBible.title,
        genre: selectedGenre,
        time: `Hoje às ${nowFormatted}`,
        updatedAt: Date.now(),
        prompt,
        episodesCount,
        bible: generatedBible,
        scripts: {},
        activeStep: 'bible',
        activeEpisodeIdx: 0,
      };

      setCurrentProjectId(newId);
      setBible(generatedBible);
      setScripts({});
      setActiveEpisodeIdx(0);
      setActiveStep('bible');

      persistProject(newProject);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro na conexão com o Ollama');
    } finally {
      setIsGeneratingBible(false);
    }
  };

  // 2. Generate Detailed Script for a Specific Episode
  const handleGenerateEpisodeScript = async (epNum: number) => {
    if (!bible || isWritingScript) return;

    const outline = bible.episodeOutlines.find((o) => o.episodeNumber === epNum);
    if (!outline) return;

    setIsWritingScript(true);
    setErrorMsg(null);

    // Collect summaries of established previous episodes
    const previousSummaries: string[] = [];
    for (let i = 1; i < epNum; i++) {
      if (scripts[i]) {
        previousSummaries.push(
          `Episódio ${i} ("${scripts[i].title}"): ${scripts[i].synopsis}. Roteiro terminou com: ${scripts[i].fullScript.slice(-300)}`,
        );
      } else {
        const prevOutline = bible.episodeOutlines.find((o) => o.episodeNumber === i);
        if (prevOutline) {
          previousSummaries.push(
            `Episódio ${i} ("${prevOutline.title}"): ${prevOutline.premise}. Termina com o cliffhanger: ${prevOutline.cliffhanger}`,
          );
        }
      }
    }

    const isGemini = selectedModel.startsWith('gemini') || aiProvider === 'gemini';
    if (isGemini && !geminiApiKey) {
      setShowSettingsModal(true);
      setErrorMsg(
        'Por favor, insira sua chave de API do Gemini nas configurações para roteirizar com o Gemini.',
      );
      setIsWritingScript(false);
      return;
    }

    try {
      const res = await fetch('/api/generate/episode-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bible,
          episodeNumber: epNum,
          episodeOutline: outline,
          previousEpisodesSummaries: previousSummaries,
          directorNotes,
          targetDurationMinutes: targetDuration,
          provider: isGemini ? 'gemini' : (aiProvider === 'nvidia' ? 'nvidia' : 'ollama'),
          model: selectedModel,
          apiKey: isGemini ? geminiApiKey : nvidiaApiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao roteirizar episódio');
      }

      const generated = data.episode as GeneratedEpisodeScript;

      // Defensively sanitize fullScript into a single string
      let scriptText = '';
      if (typeof generated.fullScript === 'string') {
        scriptText = generated.fullScript;
      } else if (Array.isArray(generated.fullScript)) {
        scriptText = (generated.fullScript as any[])
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
              return item.text || item.dialogue || item.fala || item.line || JSON.stringify(item);
            }
            return String(item);
          })
          .join('\n\n');
      } else if (typeof generated.fullScript === 'object' && generated.fullScript !== null) {
        scriptText = Object.values(generated.fullScript).map(String).join('\n\n');
      } else {
        scriptText = String((generated as any).script || (generated as any).roteiro || (generated as any).content || '');
      }

      generated.fullScript = scriptText;
      const words = scriptText.trim() ? scriptText.trim().split(/\s+/).filter(Boolean).length : 0;
      generated.wordCount = words;
      generated.durationSeconds = Math.round((words / 140) * 60) || 600;

      const nextScripts = {
        ...scripts,
        [epNum]: generated,
      };
      setScripts(nextScripts);
      setDirectorNotes('');

      // Auto-persist updated project to localStorage and disk
      if (bible) {
        const projId = currentProjectId || `proj_${Date.now()}`;
        if (!currentProjectId) setCurrentProjectId(projId);
        const nowFormatted = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        persistProject({
          id: projId,
          title: bible.title,
          genre: selectedGenre,
          time: `Hoje às ${nowFormatted}`,
          updatedAt: Date.now(),
          prompt,
          episodesCount: bible.episodeOutlines.length,
          bible,
          scripts: nextScripts,
          activeStep: 'scripts',
          activeEpisodeIdx,
        });
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao roteirizar episódio');
    } finally {
      setIsWritingScript(false);
    }
  };

  // 3. Bulk Generate All Episodes Sequentially with Strict Continuity
  const handleBulkGenerateEpisodes = async () => {
    if (!bible || isBulkWriting || isWritingScript) return;

    const isGemini = selectedModel.startsWith('gemini') || aiProvider === 'gemini';
    if (isGemini && !geminiApiKey) {
      setShowSettingsModal(true);
      setErrorMsg(
        'Por favor, insira sua chave de API do Gemini nas configurações para gerar episódios em lote com o Gemini.',
      );
      return;
    }

    setIsBulkWriting(true);
    isBulkCancelledRef.current = false;
    setErrorMsg(null);

    const outlines = bible.episodeOutlines;
    let currentScripts = { ...scripts };

    for (let i = 0; i < outlines.length; i++) {
      if (isBulkCancelledRef.current) {
        break;
      }

      const outline = outlines[i];
      const epNum = outline.episodeNumber;

      // Skip already generated episodes
      if (currentScripts[epNum]) {
        continue;
      }

      setActiveEpisodeIdx(i);
      setBulkProgress({
        currentEp: epNum,
        totalEps: outlines.length,
        status: `Roteirizando Ep ${epNum} de ${outlines.length}: "${outline.title}"...`,
      });

      // Strict sequential continuity: collect ending and established facts
      const previousSummaries: string[] = [];
      for (let j = 1; j < epNum; j++) {
        if (currentScripts[j]) {
          const lastSnippet = currentScripts[j].fullScript.slice(-400);
          previousSummaries.push(
            `Episódio ${j} ("${currentScripts[j].title}"): ${currentScripts[j].synopsis}\nO episódio encerrou com o seguinte desfecho:\n"${lastSnippet}"`,
          );
        } else {
          const prevOutline = outlines.find((o) => o.episodeNumber === j);
          if (prevOutline) {
            previousSummaries.push(
              `Episódio ${j} ("${prevOutline.title}"): ${prevOutline.premise}. Cliffhanger final: ${prevOutline.cliffhanger}`,
            );
          }
        }
      }

      try {
        const res = await fetch('/api/generate/episode-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bible,
            episodeNumber: epNum,
            episodeOutline: outline,
            previousEpisodesSummaries: previousSummaries,
            directorNotes: '',
            targetDurationMinutes: targetDuration,
            provider: isGemini ? 'gemini' : (aiProvider === 'nvidia' ? 'nvidia' : 'ollama'),
            model: selectedModel,
            apiKey: isGemini ? geminiApiKey : nvidiaApiKey,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Falha no Episódio ${epNum}`);
        }

        const generated = data.episode as GeneratedEpisodeScript;
        let scriptText = '';
        if (typeof generated.fullScript === 'string') {
          scriptText = generated.fullScript;
        } else if (Array.isArray(generated.fullScript)) {
          scriptText = (generated.fullScript as any[]).map(String).join('\n\n');
        } else {
          scriptText = String((generated as any).fullScript || '');
        }

        generated.fullScript = scriptText;
        const words = scriptText.trim() ? scriptText.trim().split(/\s+/).filter(Boolean).length : 0;
        generated.wordCount = words;
        generated.durationSeconds = Math.round((words / 140) * 60) || 600;

        currentScripts = {
          ...currentScripts,
          [epNum]: generated,
        };
        setScripts(currentScripts);

        // Auto-persist immediately
        if (currentProjectId) {
          const nowFormatted = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          persistProject({
            id: currentProjectId,
            title: bible.title,
            genre: selectedGenre,
            time: `Hoje às ${nowFormatted}`,
            updatedAt: Date.now(),
            prompt,
            episodesCount: bible.episodeOutlines.length,
            bible,
            scripts: currentScripts,
            activeStep: 'scripts',
            activeEpisodeIdx: i,
          });
        }
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : `Erro no Episódio ${epNum}`);
        break;
      }
    }

    setIsBulkWriting(false);
    setBulkProgress(null);
  };

  const handleCancelBulk = () => {
    isBulkCancelledRef.current = true;
    setIsBulkWriting(false);
    setBulkProgress(null);
  };

  // 3. Audio Synthesis & Multi-Track DAW Handlers
  const handleGenerateVoiceOnly = async (epNum: number) => {
    if (!currentProjectId || !scripts[epNum] || isGeneratingVoiceOnly) return;

    if (ttsEngine === 'gemini' && !geminiApiKey) {
      setShowSettingsModal(true);
      setErrorMsg('Por favor, insira sua chave de API do Gemini nas configurações para usar o Gemini 3.8 Flash TTS.');
      return;
    }

    setIsGeneratingVoiceOnly(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/synthesize/episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'voice_only',
          projectId: currentProjectId,
          episodeNumber: epNum,
          scriptText: scripts[epNum].fullScript,
          engine: ttsEngine,
          elevenLabsApiKey,
          geminiApiKey,
          voiceCast,
          voiceStyles,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao gerar faixa de voz.');
      }

      const updatedScripts = {
        ...scripts,
        [epNum]: {
          ...scripts[epNum],
          voiceUrl: data.voiceUrl,
          durationSeconds: data.durationSeconds,
          estimatedDuration: `${Math.round(data.durationSeconds / 60)} min`,
        },
      };

      setScripts(updatedScripts);

      if (bible) {
        persistProject({
          id: currentProjectId,
          title: bible.title,
          genre: selectedGenre,
          time: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          updatedAt: Date.now(),
          prompt,
          episodesCount: bible.episodeOutlines.length,
          bible,
          scripts: updatedScripts,
          activeStep: 'audio',
          activeEpisodeIdx: audioEpIdx,
        });
      }

      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = data.voiceUrl;
        audioPlayerRef.current.load();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro na geração da voz');
    } finally {
      setIsGeneratingVoiceOnly(false);
    }
  };

  const handleMixMultiTrack = async (epNum: number) => {
    if (!currentProjectId || !scripts[epNum] || isMixingMultiTrack) return;
    setIsMixingMultiTrack(true);
    setErrorMsg(null);

    try {
      const activeTracks = [
        {
          id: 'ambience',
          file: trackAmbienceFile,
          volume: trackAmbienceMuted ? 0 : trackAmbienceVol,
          loop: trackAmbienceLoop,
        },
        {
          id: 'sfx1',
          file: trackSfx1File,
          volume: trackSfx1Muted ? 0 : trackSfx1Vol,
          position: trackSfx1Pos,
          offsetSec: trackSfx1Offset,
        },
        {
          id: 'sfx2',
          file: trackSfx2File,
          volume: trackSfx2Muted ? 0 : trackSfx2Vol,
          position: trackSfx2Pos,
          offsetSec: trackSfx2Offset,
        },
      ];

      const res = await fetch('/api/synthesize/episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mix_multitrack',
          projectId: currentProjectId,
          episodeNumber: epNum,
          tracks: activeTracks,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao mixar faixas do episódio');
      }

      const updatedScripts = {
        ...scripts,
        [epNum]: {
          ...scripts[epNum],
          audioUrl: data.audioUrl,
          durationSeconds: data.durationSeconds,
          estimatedDuration: `${Math.round(data.durationSeconds / 60)} min`,
        },
      };

      setScripts(updatedScripts);

      if (bible) {
        persistProject({
          id: currentProjectId,
          title: bible.title,
          genre: selectedGenre,
          time: `Hoje às ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
          updatedAt: Date.now(),
          prompt,
          episodesCount: bible.episodeOutlines.length,
          bible,
          scripts: updatedScripts,
          activeStep: 'audio',
          activeEpisodeIdx: audioEpIdx,
        });
      }

      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = data.audioUrl;
        audioPlayerRef.current.load();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro na mixagem multi-track');
    } finally {
      setIsMixingMultiTrack(false);
    }
  };

  // Single-Click Full Synthesis (Voice + Multi-Track Mix)
  const handleSynthesizeEpisodeAudio = async (epNum: number) => {
    if (!currentProjectId || !scripts[epNum] || isSynthesizingSingle) return;

    if (ttsEngine === 'gemini' && !geminiApiKey) {
      setShowSettingsModal(true);
      setErrorMsg('Por favor, insira sua chave de API do Gemini nas configurações para usar o Gemini 3.8 Flash TTS.');
      return;
    }

    setIsSynthesizingSingle(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/synthesize/episode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: currentProjectId,
          episodeNumber: epNum,
          scriptText: scripts[epNum].fullScript,
          engine: ttsEngine,
          elevenLabsApiKey,
          geminiApiKey,
          voiceCast,
          voiceStyles,
          voice: selectedVoice,
          ambience: selectedAmbience,
          ambienceVolume,
          sfxStart,
          sfxEnd,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Falha ao sintetizar áudio do episódio');
      }

      setLastRenderStats({
        engineUsed: data.engineUsed,
        speakers: data.speakers,
        eventsCount: data.eventsCount,
        speechSegments: data.speechSegments,
        sfxInserted: data.sfxInserted,
        pausesInserted: data.pausesInserted,
      });

      const updatedScripts = {
        ...scripts,
        [epNum]: {
          ...scripts[epNum],
          audioUrl: data.audioUrl,
          durationSeconds: data.durationSeconds,
          estimatedDuration: `${Math.round(data.durationSeconds / 60)} min`,
        },
      };

      setScripts(updatedScripts);

      // Persist to disk and localStorage
      if (bible) {
        const nowFormatted = new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        persistProject({
          id: currentProjectId,
          title: bible.title,
          genre: selectedGenre,
          time: `Hoje às ${nowFormatted}`,
          updatedAt: Date.now(),
          prompt,
          episodesCount: bible.episodeOutlines.length,
          bible,
          scripts: updatedScripts,
          activeStep: 'audio',
          activeEpisodeIdx: audioEpIdx,
        });
      }

      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = data.audioUrl;
        audioPlayerRef.current.load();
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro na renderização do áudio');
    } finally {
      setIsSynthesizingSingle(false);
    }
  };

  const handleSynthesizeAllAudioBatch = async () => {
    if (!bible || !currentProjectId || isSynthesizingAll) return;

    const episodesToRender = bible.episodeOutlines.filter(
      (outline) => scripts[outline.episodeNumber],
    );

    if (episodesToRender.length === 0) {
      setErrorMsg('Nenhum episódio roteirizado para sintetizar áudio.');
      return;
    }

    if (ttsEngine === 'gemini' && !geminiApiKey) {
      setShowSettingsModal(true);
      setErrorMsg('Por favor, insira sua chave de API do Gemini nas configurações para sintetizar áudio em lote com o Gemini 3.8 Flash TTS.');
      return;
    }

    setIsSynthesizingAll(true);
    setErrorMsg(null);

    let updatedScripts = { ...scripts };

    for (let i = 0; i < episodesToRender.length; i++) {
      const ep = episodesToRender[i];
      const epNum = ep.episodeNumber;

      setAudioBatchProgress({
        current: i + 1,
        total: episodesToRender.length,
        title: ep.title,
      });

      try {
        const res = await fetch('/api/synthesize/episode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: currentProjectId,
            episodeNumber: epNum,
            scriptText: updatedScripts[epNum].fullScript,
            engine: ttsEngine,
            elevenLabsApiKey,
            geminiApiKey,
            voiceCast,
            voiceStyles,
            voice: selectedVoice,
            ambience: selectedAmbience,
            ambienceVolume,
            sfxStart,
            sfxEnd,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          updatedScripts = {
            ...updatedScripts,
            [epNum]: {
              ...updatedScripts[epNum],
              audioUrl: data.audioUrl,
              durationSeconds: data.durationSeconds,
              estimatedDuration: `${Math.round(data.durationSeconds / 60)} min`,
            },
          };
          setScripts(updatedScripts);

          const nowFormatted = new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
          persistProject({
            id: currentProjectId,
            title: bible.title,
            genre: selectedGenre,
            time: `Hoje às ${nowFormatted}`,
            updatedAt: Date.now(),
            prompt,
            episodesCount: bible.episodeOutlines.length,
            bible,
            scripts: updatedScripts,
            activeStep: 'audio',
            activeEpisodeIdx: i,
          });
        }
      } catch (err) {
        console.error(`Erro ao sintetizar áudio do episódio ${epNum}:`, err);
      }
    }

    setIsSynthesizingAll(false);
    setAudioBatchProgress(null);
  };

  const handleUploadCustomTrack = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/synthesize/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCustomTracks((prev) => [
          ...prev,
          { name: file.name, path: data.filePath, url: data.url },
        ]);
        setSelectedAmbience(data.filePath);
      } else {
        throw new Error(data.error || 'Falha ao enviar arquivo');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro no upload da trilha');
    }
  };

  const togglePlayAudio = () => {
    if (!audioPlayerRef.current) return;
    if (isPlayingAudio) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlayingAudio(true);
    }
  };

  const formatAudioTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 4. Publish to NestJS Backend
  const handlePublish = async () => {
    if (!bible || isPublishing) return;

    setIsPublishing(true);
    setPublishSuccess(null);
    setErrorMsg(null);

    try {
      const episodesPayload = bible.episodeOutlines.map((outline) => {
        const scriptData = scripts[outline.episodeNumber];
        return {
          episodeNumber: outline.episodeNumber,
          title: outline.title,
          synopsis: outline.premise,
          durationSeconds: scriptData?.durationSeconds || 480,
          audioUrl:
            scriptData?.audioUrl ||
            scriptData?.voiceUrl ||
            `/audio/episodes/${currentProjectId}_ep_${outline.episodeNumber}.mp3`,
          isPremium: scriptData?.isPremium !== undefined ? scriptData.isPremium : outline.episodeNumber > 1,
        };
      });

      const payload = {
        title: bible.title,
        synopsis: `${bible.logline}\n\n${bible.synopsis}`,
        coverUrl:
          bible.coverUrl ||
          'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
        author: 'AudioFic Studio',
        genreSlugs: [bible.genre],
        isFeatured: true,
        episodes: episodesPayload,
      };

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Erro ao publicar no backend');
      }

      setPublishSuccess(
        `"${bible.title}" foi publicada com sucesso no catálogo com ${episodesPayload.length} episódios!`,
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro na publicação');
    } finally {
      setIsPublishing(false);
    }
  };

  const currentOutline = bible?.episodeOutlines[activeEpisodeIdx];
  const currentScript = currentOutline ? scripts[currentOutline.episodeNumber] : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0d0f] text-zinc-200 select-none font-sans">
      {/* --- Left Sidebar (macOS / Antigravity Style) --- */}
      <aside className="w-64 border-r border-zinc-800/80 bg-[#121215]/80 backdrop-blur-md flex flex-col justify-between p-3.5 z-20 shrink-0">
        <div className="flex flex-col gap-4">
          {/* Traffic Lights & Title */}
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56]/90 border border-red-700/50" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e]/90 border border-yellow-700/50" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f]/90 border border-green-700/50" />
            </div>
            <span className="text-[11px] font-medium tracking-wider text-zinc-400 uppercase">
              Diretor Studio
            </span>
          </div>

          {/* New Story Button */}
          <Button
            onClick={() => {
              setCurrentProjectId(null);
              setBible(null);
              setScripts({});
              setPrompt('');
              setPublishSuccess(null);
              setErrorMsg(null);
              try {
                localStorage.removeItem('shortstory_studio_active_id_v1');
              } catch {}
            }}
            variant="outline"
            className="w-full justify-start gap-2 bg-zinc-900/90 border-zinc-700/70 hover:bg-zinc-800 text-zinc-200 text-xs h-9 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            Nova Série / Bíblia
          </Button>

          {/* Recents list */}
          <div className="flex flex-col gap-1.5 mt-2 flex-1 min-h-0 overflow-y-auto">
            <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-2">
              Projetos Salvos ({savedProjects.length})
            </span>
            {savedProjects.length === 0 ? (
              <p className="text-xs text-zinc-600 px-2 py-1 italic">
                Nenhum projeto salvo
              </p>
            ) : (
              savedProjects.map((item) => {
                const isActive =
                  currentProjectId === item.id || (!currentProjectId && bible?.title === item.title);
                return (
                  <div
                    key={item.id}
                    onClick={() => loadProject(item)}
                    className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-left text-xs transition-colors cursor-pointer border ${
                      isActive
                        ? 'bg-zinc-800/90 border-zinc-700/80 text-white font-medium shadow-sm'
                        : 'border-transparent text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-1.5">
                      <span className="truncate font-medium">{item.title}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {item.time || 'Salvo'} · {item.bible?.episodeOutlines?.length || 0} eps
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleDeleteProject(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-zinc-500 p-1 rounded transition-opacity shrink-0"
                      title="Excluir projeto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Hardware Status & Model Info */}
        <div className="flex flex-col gap-2 pt-3 border-t border-zinc-800/60">
          <div className="flex items-center justify-between text-xs px-1 text-zinc-400">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  ollamaOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="font-mono text-[11px]">
                {ollamaOnline ? 'Ollama Online' : 'Ollama Offline'}
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-[10px] font-mono py-0 px-1.5 border-zinc-700 bg-zinc-900 text-zinc-400"
            >
              RTX 4060 · 8GB
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-zinc-500 px-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Modelo:</span>
            <span className="font-mono text-zinc-300 truncate">
              {selectedModel}
            </span>
          </div>
        </div>
      </aside>

      {/* --- Main Workspace Canvas --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0d0d0f] relative">
        {/* Top Breadcrumb & Step Navigation */}
        <header className="h-12 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#111114]/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-zinc-500 hover:text-zinc-400">audiofic</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-400 font-medium">Studio</span>
            <span className="text-zinc-600">/</span>
            <span className="text-zinc-200 font-semibold truncate max-w-sm">
              {bible ? bible.title : 'Modo Diretor (Show Bible)'}
            </span>
          </div>

          {/* Workflow Tabs (When bible exists) */}
          {bible && (
            <div className="flex items-center bg-zinc-900/90 border border-zinc-800 rounded-lg p-0.5">
              <button
                onClick={() => setActiveStep('bible')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeStep === 'bible'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ScrollText className="w-3 h-3 text-rose-400" />
                1. Bíblia da Série
              </button>
              <button
                onClick={() => setActiveStep('outlines')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeStep === 'outlines'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Compass className="w-3 h-3 text-amber-400" />
                2. Mapa de Episódios
              </button>
              <button
                onClick={() => setActiveStep('scripts')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeStep === 'scripts'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileEdit className="w-3 h-3 text-cyan-400" />
                3. Roteiro Profundo ({Object.keys(scripts).length}/{bible.episodeOutlines.length})
              </button>
              <button
                onClick={() => setActiveStep('audio')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeStep === 'audio'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileAudio className="w-3 h-3 text-purple-400" />
                4. Áudio & Capa
              </button>
              <button
                onClick={() => setActiveStep('publish')}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                  activeStep === 'publish'
                    ? 'bg-zinc-800 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Send className="w-3 h-3 text-emerald-400" />
                5. Publicar
              </button>
            </div>
          )}
        </header>

        {/* Scrollable Center Canvas */}
        <div className="flex-1 overflow-y-auto p-8 pb-32">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Alerts */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl border border-red-900/50 bg-red-950/30 text-red-300 text-xs flex items-center justify-between gap-2.5 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMsg(null)}
                  className="text-red-400/80 hover:text-red-200 text-xs px-2 py-0.5 rounded hover:bg-red-900/40 transition-colors shrink-0"
                >
                  ✕
                </button>
              </div>
            )}
            {publishSuccess && (
              <div className="p-3.5 rounded-xl border border-emerald-900/50 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{publishSuccess}</span>
              </div>
            )}

            {/* Empty State / Welcome Screen */}
            {!bible && !isGeneratingBible && (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg">
                  <Headphones className="w-7 h-7 text-rose-500" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-xl font-semibold tracking-tight text-zinc-100">
                    Sala de Roteiristas & Bíblia da Série
                  </h2>
                  <p className="text-sm text-zinc-400 max-w-md mx-auto">
                    Digite a ideia central. A IA criará a <strong>Bíblia da Série</strong> (personagens, segredos, regras do universo) para você aprovar e direcionar os episódios completos de 10 a 15 minutos.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 justify-center max-w-xl pt-4">
                  {[
                    'Um arquivista forense ouve sussurros gravados em fitas cassete de crimes não resolvidos',
                    'Uma vila no interior de Minas Gerais onde as sombras dos moradores não se movem com o sol',
                    'O farol abandonado que volta a acender sozinho toda vez que alguém se afoga na costa',
                  ].map((sug, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(sug)}
                      className="text-xs px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all text-left"
                    >
                      &quot;{sug}&quot;
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State for Bible Generation */}
            {isGeneratingBible && (
              <div className="py-24 text-center flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-2 border-rose-500/20 border-t-rose-500 animate-spin" />
                  <Sparkles className="w-5 h-5 text-rose-400 absolute inset-0 m-auto" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-zinc-200">
                    Qwen 2.5 criando a Bíblia da Série...
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Construindo personagens, regras do terror e mapa dos episódios
                  </p>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* ETAPA 1: BÍBLIA DA SÉRIE (PERSONAGENS, REGRAS E CENÁRIOS) */}
            {/* ======================================================== */}
            {bible && activeStep === 'bible' && (
              <div className="space-y-6">
                {/* Series Main Info */}
                <Card className="bg-[#141418]/90 border-zinc-800/80 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-rose-950/60 text-rose-300 border-rose-800/50 text-[10px] uppercase font-semibold">
                      {bible.genre}
                    </Badge>
                    <span className="text-xs text-zinc-500 font-mono">
                      Tom: {bible.tone}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                      Título da Série
                    </label>
                    <Input
                      value={bible.title}
                      onChange={(e) => setBible({ ...bible, title: e.target.value })}
                      className="text-2xl font-bold bg-transparent border-0 border-b border-zinc-800 rounded-none px-0 text-white focus-visible:ring-0 focus-visible:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                      Logline (Promessa Narrativa)
                    </label>
                    <Input
                      value={bible.logline}
                      onChange={(e) => setBible({ ...bible, logline: e.target.value })}
                      className="text-sm font-medium italic bg-zinc-900/60 border-zinc-800 text-zinc-200"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold">
                      Sinopse Geral da Temporada
                    </label>
                    <Textarea
                      value={bible.synopsis}
                      onChange={(e) => setBible({ ...bible, synopsis: e.target.value })}
                      rows={3}
                      className="text-xs text-zinc-300 bg-zinc-900/60 border-zinc-800 leading-relaxed"
                    />
                  </div>
                </Card>

                {/* Character Cards & Voice Casting (Fichas dos Personagens & Elenco de Vozes) */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <User className="w-4 h-4 text-rose-400" />
                      Fichas dos Personagens & Elenco de Vozes (Gemini TTS)
                    </h3>
                    <Badge variant="outline" className="text-[10px] border-rose-900/40 text-rose-300 font-mono">
                      ✨ Catálogo Gemini: 2.000+ Vozes & Direção Dramática
                    </Badge>
                  </div>

                  {/* NARRATOR VOICE CARD */}
                  <Card className="bg-[#141418] border-zinc-800 rounded-xl p-4 shadow-lg border-l-4 border-l-rose-500 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <Mic className="w-4 h-4 text-rose-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          🎙️ NARRADOR (Voz Principal de Suspense da Série)
                        </span>
                        <Badge className="bg-rose-950/80 text-rose-300 border-rose-800/50 text-[10px]">
                          Terceira Pessoa
                        </Badge>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        Voz usada para descrever cenários, clima macabro e transições
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                          Voz do Narrador (Gemini TTS):
                        </label>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={bible.narratorVoice || voiceCast['NARRADOR'] || 'Charon'}
                            onChange={(e) => handleUpdateNarratorVoice(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                          >
                            <optgroup label="Recomendadas para Narrador de Ficção">
                              <option value="Charon">Charon (Grave, profundo e cinematográfico)</option>
                              <option value="Koda">Koda (Direto, firme e profissional · Pitch médio-baixo)</option>
                              <option value="Fenrir">Fenrir (Áspero, ameaçador e autoritário)</option>
                              <option value="Bodi">Bodi (Sussurrado, calmo e intimista · Pitch baixo)</option>
                            </optgroup>
                            <optgroup label="Todas as Vozes em Destaque (2.000+)">
                              {GEMINI_POPULAR_VOICES.map((v) => (
                                <option key={v.name} value={v.name}>
                                  {v.name} — {v.desc}
                                </option>
                              ))}
                            </optgroup>
                          </select>
                          <Input
                            placeholder="Ou digite o nome de qualquer voz..."
                            value={bible.narratorVoice || ''}
                            onChange={(e) => handleUpdateNarratorVoice(e.target.value)}
                            className="w-36 text-xs h-8 bg-zinc-950 border-zinc-800 text-zinc-200 font-mono text-[11px]"
                            title="Digite qualquer nome das 2.000+ vozes do Gemini"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] text-zinc-400 block mb-1 font-medium">
                          Preset de Estilo / Atuação do Narrador:
                        </label>
                        <select
                          value={
                            VOICE_STYLE_PRESETS.some((p) => p.value === (bible.narratorStyle || voiceStyles['NARRADOR']))
                              ? (bible.narratorStyle || voiceStyles['NARRADOR'])
                              : 'custom'
                          }
                          onChange={(e) => {
                            if (e.target.value !== 'custom') {
                              handleUpdateNarratorVoice(bible.narratorVoice || 'Charon', e.target.value);
                            }
                          }}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                        >
                          {VOICE_STYLE_PRESETS.map((p) => (
                            <option key={p.value} value={p.value}>
                              {p.label}
                            </option>
                          ))}
                          <option value="custom">✍️ Estilo Personalizado...</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-0.5">Direção de Atuação para a IA (Prompt de Sistema):</label>
                      <Input
                        placeholder="Instrução detalhada de atuação para o Narrador..."
                        value={bible.narratorStyle || voiceStyles['NARRADOR'] || 'Voz profunda, solene, pausas dramáticas de suspense e dicção impecável'}
                        onChange={(e) => handleUpdateNarratorVoice(bible.narratorVoice || 'Charon', e.target.value)}
                        className="text-xs h-8 bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-rose-500 font-mono text-[11px]"
                      />
                    </div>
                  </Card>

                  {/* CHARACTER CARDS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bible.characters.map((char, i) => (
                      <Card
                        key={i}
                        className="bg-[#131317]/90 border-zinc-800 rounded-xl p-4 space-y-3 shadow-md"
                      >
                        <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                          <span className="font-semibold text-sm text-zinc-100 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            {char.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-zinc-700 text-zinc-400"
                          >
                            {char.role}
                          </Badge>
                        </div>

                        <p className="text-xs text-zinc-300">
                          <strong className="text-zinc-400">Psicologia:</strong>{' '}
                          {char.personality}
                        </p>
                        <p className="text-xs text-amber-300/90 bg-amber-950/20 p-2 rounded-lg border border-amber-900/30">
                          <strong>Culpa / Segredo Oculto:</strong> {char.secret}
                        </p>

                        {/* Gemini Voice & Acting Direction Selector */}
                        <div className="pt-2 border-t border-zinc-800/80 space-y-2.5 bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Mic className="w-3.5 h-3.5 text-rose-400" />
                              Voz & Atuação (Gemini TTS)
                            </span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              2.000+ Opções
                            </span>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-0.5 font-medium">Voz Selecionada:</label>
                              <div className="flex items-center gap-1.5">
                                <select
                                  value={char.geminiVoice || voiceCast[char.name.toUpperCase()] || 'Koda'}
                                  onChange={(e) => handleUpdateCharacterVoice(i, e.target.value)}
                                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                                >
                                  <optgroup label="Tutor / Entrevistador (Quiet & Intimate)">
                                    <option value="Bodi">Bodi (Quiet and intimate · Low pitch)</option>
                                    <option value="Lumi">Lumi (Warm and approachable · Low pitch)</option>
                                    <option value="Sola">Sola (Gentle and relaxed · Very high pitch)</option>
                                  </optgroup>
                                  <optgroup label="Comercial & Suspense (Direct & Confident)">
                                    <option value="Koda">Koda (Direct and helpful · Medium-low pitch)</option>
                                    <option value="Nika">Nika (Warm and approachable · Medium pitch)</option>
                                    <option value="Tavi">Tavi (Quiet and intimate · Medium-high pitch)</option>
                                    <option value="Kira">Kira (Cool and confident · Medium pitch)</option>
                                  </optgroup>
                                  <optgroup label="Ficção / Clássicas Gemini">
                                    <option value="Puck">Puck (Expressivo, jovem, dramático)</option>
                                    <option value="Charon">Charon (Grave, profundo, sombrio)</option>
                                    <option value="Kore">Kore (Calma, investigativa, reflexiva)</option>
                                    <option value="Fenrir">Fenrir (Áspero, imponente, intimidador)</option>
                                    <option value="Aoede">Aoede (Melodiosa, profunda, emotiva)</option>
                                  </optgroup>
                                </select>
                                <Input
                                  placeholder="Outra voz..."
                                  value={char.geminiVoice || ''}
                                  onChange={(e) => handleUpdateCharacterVoice(i, e.target.value)}
                                  className="w-32 text-xs h-7 bg-zinc-900 border-zinc-700 text-zinc-200 font-mono text-[11px]"
                                  title="Digite o nome de qualquer uma das 2.000+ vozes do catálogo da Google"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-400 block mb-0.5 font-medium">Preset de Estilo / Emoção:</label>
                              <select
                                value={
                                  VOICE_STYLE_PRESETS.some((p) => p.value === (char.voiceStyle || voiceStyles[char.name.toUpperCase()]))
                                    ? (char.voiceStyle || voiceStyles[char.name.toUpperCase()])
                                    : 'custom'
                                }
                                onChange={(e) => {
                                  if (e.target.value !== 'custom') {
                                    handleUpdateCharacterStyle(i, e.target.value);
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-zinc-700/80 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-rose-500 cursor-pointer"
                              >
                                {VOICE_STYLE_PRESETS.map((p) => (
                                  <option key={p.value} value={p.value}>
                                    {p.label}
                                  </option>
                                ))}
                                <option value="custom">✍️ Estilo Personalizado...</option>
                              </select>
                            </div>

                            <div>
                              <label className="text-[10px] text-zinc-500 block mb-0.5">Direção de Atuação para a IA:</label>
                              <Input
                                placeholder="Ex: sussurro tenso com respiração ofegante contida..."
                                value={char.voiceStyle || voiceStyles[char.name.toUpperCase()] || ''}
                                onChange={(e) => handleUpdateCharacterStyle(i, e.target.value)}
                                className="text-[11px] h-7 bg-zinc-900/90 border-zinc-800 text-zinc-300 focus:border-rose-500"
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Universe Rules & Settings */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Settings */}
                  <Card className="bg-[#131317]/90 border-zinc-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      Cenários Principais
                    </h4>
                    {bible.settings.map((s, i) => (
                      <div key={i} className="text-xs border-b border-zinc-800/40 pb-2 last:border-0">
                        <span className="font-semibold text-zinc-200 block">{s.name}</span>
                        <span className="text-zinc-400 leading-relaxed block pt-0.5">
                          {s.sensoryDescription}
                        </span>
                      </div>
                    ))}
                  </Card>

                  {/* Rules of Terror */}
                  <Card className="bg-[#131317]/90 border-zinc-800 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      Regras do Sobrenatural / Mistério
                    </h4>
                    <ul className="space-y-2 text-xs text-zinc-300">
                      {bible.universeRules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 bg-zinc-900/60 p-2 rounded-lg border border-zinc-800/60">
                          <span className="text-rose-500 font-bold shrink-0">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={() => setActiveStep('outlines')}
                    className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold px-5 rounded-xl shadow-md"
                  >
                    Aprovar Bíblia & Ver Mapa de Episódios
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* ETAPA 2: MAPA DOS EPISÓDIOS (OUTLINES & CLIFFHANGERS) */}
            {/* ======================================================== */}
            {bible && activeStep === 'outlines' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
                    <span>Mapa de Episódios (Beat Sheet)</span>
                    <Badge variant="outline" className="text-xs border-amber-800/80 bg-amber-950/30 text-amber-300">
                      {bible.episodeOutlines.length} Episódios
                    </Badge>
                  </h3>
                  <p className="text-xs text-zinc-400 pt-1">
                    Aqui você define o caminho da história. Altere o gancho, a revelação ou o clímax de qualquer episódio antes de mandar a IA escrever o texto completo.
                  </p>
                </div>

                <div className="space-y-4">
                  {bible.episodeOutlines.map((ep, idx) => (
                    <Card
                      key={idx}
                      className="bg-[#131317]/90 border-zinc-800 rounded-xl p-5 space-y-3 shadow-md"
                    >
                      <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-rose-950 text-rose-300 text-xs font-bold flex items-center justify-center border border-rose-800/50">
                            {ep.episodeNumber}
                          </span>
                          <Input
                            value={ep.title}
                            onChange={(e) => {
                              const updated = [...bible.episodeOutlines];
                              updated[idx].title = e.target.value;
                              setBible({ ...bible, episodeOutlines: updated });
                            }}
                            className="h-8 font-semibold text-sm bg-transparent border-0 px-1 text-zinc-100 focus-visible:ring-0 focus-visible:bg-zinc-900"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[10px] border-zinc-700 text-zinc-400"
                          >
                            {scripts[ep.episodeNumber] ? '✅ Roteirizado' : '⏳ Pendente'}
                          </Badge>
                          {bible.episodeOutlines.length > 1 && (
                            <button
                              onClick={() => {
                                const filtered = bible.episodeOutlines
                                  .filter((_, i) => i !== idx)
                                  .map((item, i) => ({ ...item, episodeNumber: i + 1 }));
                                setBible({ ...bible, episodeOutlines: filtered });
                                if (activeEpisodeIdx >= filtered.length) {
                                  setActiveEpisodeIdx(Math.max(0, filtered.length - 1));
                                }
                              }}
                              className="text-zinc-600 hover:text-red-400 transition-colors p-1 rounded"
                              title="Remover episódio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs pt-1">
                        <div className="space-y-1">
                          <span className="text-zinc-500 font-semibold block">O Início:</span>
                          <Textarea
                            value={ep.premise}
                            onChange={(e) => {
                              const updated = [...bible.episodeOutlines];
                              updated[idx].premise = e.target.value;
                              setBible({ ...bible, episodeOutlines: updated });
                            }}
                            rows={3}
                            className="text-xs text-zinc-300 bg-zinc-900/60 border-zinc-800 resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-zinc-500 font-semibold block">A Virada / Revelação:</span>
                          <Textarea
                            value={ep.turningPoint}
                            onChange={(e) => {
                              const updated = [...bible.episodeOutlines];
                              updated[idx].turningPoint = e.target.value;
                              setBible({ ...bible, episodeOutlines: updated });
                            }}
                            rows={3}
                            className="text-xs text-zinc-300 bg-zinc-900/60 border-zinc-800 resize-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <span className="text-rose-400 font-semibold block">Cliffhanger (Gancho Final):</span>
                          <Textarea
                            value={ep.cliffhanger}
                            onChange={(e) => {
                              const updated = [...bible.episodeOutlines];
                              updated[idx].cliffhanger = e.target.value;
                              setBible({ ...bible, episodeOutlines: updated });
                            }}
                            rows={3}
                            className="text-xs text-rose-200 bg-rose-950/20 border-rose-900/40 resize-none"
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <Button
                    onClick={() => {
                      if (bible.episodeOutlines.length >= 20) return;
                      const nextNum = bible.episodeOutlines.length + 1;
                      const newOutline: EpisodeOutline = {
                        episodeNumber: nextNum,
                        title: `Episódio ${nextNum}`,
                        premise: 'A investigação avança enquanto os riscos aumentam...',
                        turningPoint: 'Uma descoberta sombria abala as certezas dos personagens...',
                        cliffhanger: 'Um gancho perturbador que deixa o desfecho em aberto.',
                      };
                      setBible({
                        ...bible,
                        episodeOutlines: [...bible.episodeOutlines, newOutline],
                      });
                    }}
                    disabled={bible.episodeOutlines.length >= 20}
                    variant="outline"
                    className="gap-1.5 text-xs bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:bg-zinc-800 rounded-xl"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-400" />
                    Adicionar Episódio ({bible.episodeOutlines.length}/20)
                  </Button>

                  <Button
                    onClick={() => setActiveStep('scripts')}
                    className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold px-5 rounded-xl shadow-md"
                  >
                    Avançar para Escrever os Roteiros Detalhados
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* ETAPA 3: ROTEIRIZAÇÃO PROFUNDA (EPISÓDIO POR EPISÓDIO) */}
            {/* ======================================================== */}
            {bible && activeStep === 'scripts' && (
              <div className="space-y-6">
                {/* Episode Switcher Header & Grid */}
                <div className="space-y-2.5 pb-2 border-b border-zinc-800/80">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-200">
                        Navegar Episódios ({bible.episodeOutlines.length} no total):
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        (Ep {currentOutline?.episodeNumber || 1} selecionado)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* AI Engine & API Key Settings */}
                      <Button
                        onClick={() => setShowSettingsModal(true)}
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5 text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                        title="Configurar motor de IA (Ollama / Gemini / NVIDIA NIM)"
                      >
                        <Settings className="w-3.5 h-3.5 text-amber-400" />
                        <span>
                          {selectedModel.startsWith('gemini')
                            ? `Gemini ${selectedModel.replace('gemini-', '')}`
                            : aiProvider === 'gemini'
                            ? 'Gemini 2.5 Flash'
                            : aiProvider === 'nvidia'
                            ? 'NVIDIA NIM (70B)'
                            : selectedModel || 'Ollama Local (7B)'}
                        </span>
                      </Button>

                      {/* Bulk Generate Button */}
                      <Button
                        onClick={handleBulkGenerateEpisodes}
                        disabled={isBulkWriting || isWritingScript}
                        className="h-8 gap-1.5 text-xs bg-gradient-to-r from-purple-600 to-rose-600 hover:from-purple-500 hover:to-rose-500 text-white font-medium shadow-md"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gerar Temporada em Lote (Bulk)</span>
                      </Button>
                    </div>
                  </div>

                  {/* Live Bulk Generation Progress Card */}
                  {isBulkWriting && (
                    <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between shadow-lg">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-purple-200 block">
                            {bulkProgress?.status || 'Escrevendo episódios em lote...'}
                          </span>
                          <span className="text-[11px] text-purple-300/80">
                            Episódio {bulkProgress?.currentEp} de {bulkProgress?.totalEps} · Fatos e cliffhangers alimentando o próximo capítulo
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={handleCancelBulk}
                        variant="destructive"
                        size="sm"
                        className="text-xs h-7 px-3 bg-red-950 border border-red-800 hover:bg-red-900 text-red-200"
                      >
                        Pausar Geração
                      </Button>
                    </div>
                  )}

                  {/* All episode pills in a clean flex-wrap so none are hidden */}
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80">
                    {bible.episodeOutlines.map((ep, idx) => {
                      const isSelected = activeEpisodeIdx === idx;
                      const isDone = !!scripts[ep.episodeNumber];
                      return (
                        <button
                          key={idx}
                          onClick={() => setActiveEpisodeIdx(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-rose-950 text-rose-200 border border-rose-600 shadow-sm shadow-rose-950/60 font-semibold'
                              : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/90 border border-zinc-800'
                          }`}
                        >
                          <span>Ep {ep.episodeNumber}</span>
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? 'bg-rose-400' : 'bg-zinc-600'
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Director Guidance Card */}
                {currentOutline && (
                  <Card className="bg-[#141418]/90 border-zinc-800/80 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                          <span className="shrink-0 text-rose-400">Episódio {currentOutline.episodeNumber}:</span>
                          <span className="text-white">{currentOutline.title}</span>
                        </h4>
                        <p className="text-xs text-zinc-400 pt-0.5">
                          Cliffhanger planejado: <strong className="text-rose-300">{currentOutline.cliffhanger}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                        {/* Model selector for Episode Scriptwriting */}
                        <div className="flex items-center gap-1.5">
                          <select
                            value={selectedModel}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSelectedModel(val);
                              try {
                                localStorage.setItem('shortstory_selected_model', val);
                              } catch {}
                              if (val.startsWith('gemini')) {
                                setAiProvider('gemini');
                                try {
                                  localStorage.setItem('shortstory_ai_provider', 'gemini');
                                } catch {}
                                if (!geminiApiKey) {
                                  setShowSettingsModal(true);
                                }
                              } else {
                                setAiProvider('ollama');
                                try {
                                  localStorage.setItem('shortstory_ai_provider', 'ollama');
                                } catch {}
                              }
                            }}
                            className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer font-medium"
                          >
                            <optgroup label="Google Gemini (Nuvem / Sem Loops)">
                              <option value="gemini-3.8-flash">
                                ✨ Gemini 3.8 Flash {geminiApiKey ? '✓' : '(requer chave)'}
                              </option>
                              <option value="gemini-3.6-flash">
                                ⚡ Gemini 3.6 Flash {geminiApiKey ? '✓' : '(requer chave)'}
                              </option>
                              <option value="gemini-3.5-flash-lite">
                                🚀 Gemini 3.5 Flash-Lite {geminiApiKey ? '✓' : '(requer chave)'}
                              </option>
                              <option value="gemini-3.1-flash-lite">
                                ⚡ Gemini 3.1 Flash-Lite {geminiApiKey ? '✓' : '(requer chave)'}
                              </option>
                            </optgroup>
                            <optgroup label="Ollama Local (Offline / RTX 4060)">
                              {models.map((m) => (
                                <option key={m} value={m}>
                                  ⚡ {m}
                                </option>
                              ))}
                            </optgroup>
                          </select>

                          {selectedModel.startsWith('gemini') && (
                            <button
                              type="button"
                              onClick={() => setShowSettingsModal(true)}
                              className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border transition-colors ${
                                geminiApiKey
                                  ? 'bg-purple-950/60 border-purple-800/50 text-purple-300 hover:bg-purple-900/60'
                                  : 'bg-amber-950/60 border-amber-800/50 text-amber-300 hover:bg-amber-900/60 animate-pulse'
                              }`}
                              title={
                                geminiApiKey
                                  ? 'Chave de API do Gemini configurada'
                                  : 'Clique para inserir sua chave de API do Gemini'
                              }
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{geminiApiKey ? 'Chave OK' : 'Chave'}</span>
                            </button>
                          )}
                        </div>

                        <select
                          value={targetDuration}
                          onChange={(e) => setTargetDuration(Number(e.target.value))}
                          className="bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                        >
                          <option value={5}>Curto (~5 min / ~700 palavras)</option>
                          <option value={10}>Padrão (~10 min / ~1.400 palavras)</option>
                          <option value={15}>Longo (~15 min / ~2.100 palavras)</option>
                        </select>

                        <Button
                          onClick={() => handleGenerateEpisodeScript(currentOutline.episodeNumber)}
                          disabled={isWritingScript}
                          className="gap-2 bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs px-4 rounded-xl shadow-lg shrink-0"
                        >
                          {isWritingScript ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Escrevendo Episódio...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              {currentScript ? 'Reescrever Roteiro' : 'Escrever Roteiro Detalhado'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Custom Director Notes */}
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3 h-3 text-cyan-400" />
                        Suas Instruções de Direção para Este Episódio (Opcional):
                      </label>
                      <Input
                        value={directorNotes}
                        onChange={(e) => setDirectorNotes(e.target.value)}
                        placeholder="Ex: Quero que o Carlos descubra o diário trancado no sótão e a voz no rádio comece a chamá-lo pelo nome..."
                        className="text-xs bg-zinc-900/60 border-zinc-800 text-zinc-200 placeholder:text-zinc-600"
                      />
                    </div>
                  </Card>
                )}

                {/* Script Viewer & Direct Editor */}
                {currentScript ? (
                  <Card className="bg-[#111115] border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
                    <CardHeader className="py-3 px-5 bg-zinc-900/60 border-b border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200">
                          Roteiro do Episódio {currentScript.episodeNumber}
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono">
                          ({currentScript.wordCount || 0} palavras · ~{Math.round((currentScript.durationSeconds || 0) / 60)} min)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyCleanScript(currentScript.episodeNumber)}
                          className={`h-7 px-3 gap-1.5 text-xs font-medium rounded-lg transition-all ${
                            copiedScriptEp === currentScript.episodeNumber
                              ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
                          }`}
                          title="Copia o roteiro limpo (sem rubricas técnicas de som) para colar direto no Google AI Studio"
                        >
                          {copiedScriptEp === currentScript.episodeNumber ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Texto Limpo Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-blue-400" />
                              <span>📋 Copiar p/ Google AI Studio</span>
                            </>
                          )}
                        </Button>

                        <a
                          href="https://aistudio.google.com/live"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-7 px-2.5 rounded-lg bg-blue-950/60 border border-blue-800 hover:bg-blue-900/80 text-blue-300 text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Abrir o Google AI Studio para sintetizar voz ilimitada com seu plano Gemini Pro"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>AI Studio ↗</span>
                        </a>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Textarea
                        value={currentScript.fullScript}
                        onChange={(e) => {
                          const updatedText = e.target.value;
                          const words = updatedText.trim()
                            ? updatedText.trim().split(/\s+/).filter(Boolean).length
                            : 0;
                          const updatedEp = {
                            ...currentScript,
                            fullScript: updatedText,
                            wordCount: words,
                            durationSeconds: Math.round((words / 140) * 60),
                          };
                          const nextScripts = {
                            ...scripts,
                            [currentScript.episodeNumber]: updatedEp,
                          };
                          setScripts(nextScripts);

                          if (bible && currentProjectId) {
                            persistProject({
                              id: currentProjectId,
                              title: bible.title,
                              genre: selectedGenre,
                              time: 'Editado agora',
                              updatedAt: Date.now(),
                              prompt,
                              episodesCount: bible.episodeOutlines.length,
                              bible,
                              scripts: nextScripts,
                              activeStep: 'scripts',
                              activeEpisodeIdx,
                            });
                          }
                        }}
                        rows={18}
                        className="w-full bg-transparent border-0 font-mono text-xs text-zinc-200 leading-relaxed p-5 resize-none focus-visible:ring-0 whitespace-pre-wrap"
                      />
                    </CardContent>
                  </Card>
                ) : (
                  !isWritingScript && (
                    <div className="py-16 text-center border border-dashed border-zinc-800 rounded-2xl">
                      <p className="text-xs text-zinc-500">
                        Clique em <strong>&quot;Escrever Roteiro Detalhado&quot;</strong> acima para a IA redigir todas as cenas e diálogos deste capítulo.
                      </p>
                    </div>
                  )
                )}

                {/* Progress and Navigation controls */}
                <div className="flex flex-wrap gap-3 justify-between items-center pt-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activeEpisodeIdx === 0}
                      onClick={() => setActiveEpisodeIdx((prev) => Math.max(0, prev - 1))}
                      className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 h-8"
                    >
                      ← Ep Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={activeEpisodeIdx >= bible.episodeOutlines.length - 1}
                      onClick={() =>
                        setActiveEpisodeIdx((prev) =>
                          Math.min(bible.episodeOutlines.length - 1, prev + 1),
                        )
                      }
                      className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 h-8"
                    >
                      Próximo Ep →
                    </Button>
                    <span className="text-xs text-zinc-500 font-mono ml-2">
                      {Object.keys(scripts).length} de {bible.episodeOutlines.length} episódios roteirizados
                    </span>
                  </div>

                  <Button
                    onClick={() => setActiveStep('audio')}
                    className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold px-5 rounded-xl shadow-md h-9"
                  >
                    Avançar para Áudio & Capa
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* ETAPA 4: ÁUDIO, CAPA & GESTÃO DE EPISÓDIOS */}
            {/* ======================================================== */}
            {bible && activeStep === 'audio' && (() => {
              const totalEps = bible.episodeOutlines.length;
              const epsWithAudio = bible.episodeOutlines.filter(
                (ep) => scripts[ep.episodeNumber]?.audioUrl,
              ).length;
              const freeEpsCount = bible.episodeOutlines.filter((ep) => {
                const s = scripts[ep.episodeNumber];
                return s?.isPremium !== undefined ? !s.isPremium : ep.episodeNumber === 1;
              }).length;
              const premiumEpsCount = totalEps - freeEpsCount;

              const PRESET_COVERS = [
                {
                  label: 'Floresta Nebulosa',
                  url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
                },
                {
                  label: 'Mansão Sombria',
                  url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
                },
                {
                  label: 'Rua Chuvosa Noturna',
                  url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
                },
                {
                  label: 'Farol Solitário',
                  url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
                },
              ];

              return (
                <div className="space-y-6">
                  {/* Step Header & Overview Stats */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-[#141418] border border-zinc-800/80 shadow-xl">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FileAudio className="w-5 h-5 text-purple-400" />
                        <h3 className="text-base font-bold text-white">
                          Áudio, Capa & Monetização da Série
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Defina o pôster oficial, importe os áudios gerados no Google AI Studio e configure o acesso de cada episódio.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                        <span className="text-zinc-400">Áudios:</span>
                        <span className={`font-semibold ${epsWithAudio === totalEps ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {epsWithAudio}/{totalEps} prontos
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                        <span className="text-emerald-400 font-semibold">{freeEpsCount} Grátis</span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-amber-400 font-semibold">{premiumEpsCount} Premium</span>
                      </div>

                      <Button
                        onClick={() => setActiveStep('publish')}
                        className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold px-4 rounded-xl shadow-md h-9"
                      >
                        Avançar p/ Publicar
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* 1. Capa Oficial da Série */}
                  <Card className="bg-[#141418]/90 border-zinc-800/80 rounded-2xl p-5 shadow-xl">
                    <div className="flex flex-col sm:flex-row gap-5 items-start">
                      {/* Poster Preview */}
                      <div className="relative w-36 h-48 sm:w-44 sm:h-56 rounded-xl overflow-hidden bg-zinc-950 border border-zinc-800 shrink-0 shadow-lg group">
                        {bible.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={bible.coverUrl}
                            alt={bible.title}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center space-y-2 text-zinc-600">
                            <ImageIcon className="w-8 h-8 text-zinc-600" />
                            <span className="text-[11px] leading-tight">Sem capa definida</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                          <span className="text-[10px] text-zinc-300 font-medium">Cartaz 2:3 Mobile</span>
                        </div>
                      </div>

                      {/* Cover Controls */}
                      <div className="flex-1 space-y-3.5 w-full">
                        <div>
                          <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-rose-400" />
                            <h4 className="text-sm font-bold text-white">Pôster / Capa Oficial</h4>
                          </div>
                          <p className="text-xs text-zinc-400 pt-0.5">
                            Cartaz exibido no feed e no player do aplicativo móvel. Recomendado proporção 2:3 ou 3:4.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingCover}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleUploadCover(f);
                              }}
                              className="hidden"
                            />
                            <span className="inline-flex items-center gap-1.5 h-8 px-3.5 text-xs font-semibold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors shadow-sm cursor-pointer">
                              {isUploadingCover ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                                  Enviando Capa...
                                </>
                              ) : (
                                <>
                                  <Upload className="w-3.5 h-3.5 text-rose-400" />
                                  Fazer Upload de Imagem
                                </>
                              )}
                            </span>
                          </label>

                          {bible.coverUrl && (
                            <button
                              type="button"
                              onClick={() => handleUpdateCoverUrl('')}
                              className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1"
                            >
                              Remover capa
                            </button>
                          )}
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] text-zinc-400 block font-medium">
                            Ou insira a URL direta da imagem:
                          </label>
                          <Input
                            placeholder="https://images.unsplash.com/... ou URL do Cloudflare R2"
                            value={bible.coverUrl || ''}
                            onChange={(e) => handleUpdateCoverUrl(e.target.value)}
                            className="bg-zinc-950 border-zinc-800 text-xs h-8 text-zinc-200 font-mono"
                          />
                        </div>

                        {/* Presets */}
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] text-zinc-500 uppercase tracking-wider block">
                            Capas Prontas (Atmosféricas):
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {PRESET_COVERS.map((preset) => (
                              <button
                                key={preset.label}
                                type="button"
                                onClick={() => handleUpdateCoverUrl(preset.url)}
                                className={`text-[11px] px-2.5 py-1 rounded-md border transition-colors ${
                                  bible.coverUrl === preset.url
                                    ? 'bg-rose-950/60 border-rose-800 text-rose-300'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 2. Google AI Studio Workflow Hint */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-zinc-900/60 border border-purple-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-bold text-purple-200">
                          Fluxo Ilimitado no Google AI Studio
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-300/80 leading-relaxed max-w-2xl">
                        Copie as falas limpas do episódio abaixo, cole na aba <strong>Speech / Gemini</strong> do Google AI Studio com sua conta, ajuste as vozes e baixe o áudio final para importar aqui com 1 clique.
                      </p>
                    </div>

                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shrink-0 shadow-md transition-colors"
                    >
                      <span>Abrir AI Studio</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  {/* 3. Lista de Episódios: Áudios & Monetização */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <Disc3 className="w-3.5 h-3.5 text-zinc-400" />
                        Episódios & Faixas de Áudio ({bible.episodeOutlines.length})
                      </h4>
                      <span className="text-[11px] text-zinc-500">
                        Clique no selo de acesso para alternar entre Gratuito e Premium
                      </span>
                    </div>

                    <div className="space-y-3">
                      {bible.episodeOutlines.map((outline) => {
                        const epNum = outline.episodeNumber;
                        const scriptData = scripts[epNum];
                        const hasAudio = !!scriptData?.audioUrl;
                        const isPremium =
                          scriptData?.isPremium !== undefined
                            ? scriptData.isPremium
                            : epNum > 1;
                        const durationText = scriptData?.durationSeconds
                          ? `${Math.floor(scriptData.durationSeconds / 60)}m ${String(
                              scriptData.durationSeconds % 60,
                            ).padStart(2, '0')}s`
                          : scriptData?.estimatedDuration || null;

                        return (
                          <Card
                            key={epNum}
                            className={`p-4 rounded-xl border transition-all ${
                              hasAudio
                                ? 'bg-[#141418] border-zinc-800/90 shadow-md'
                                : 'bg-[#111114] border-zinc-800/60'
                            }`}
                          >
                            <div className="flex flex-col gap-3">
                              {/* Top row: Number, Title, Monetization Toggle, Duration */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0">
                                    {String(epNum).padStart(2, '0')}
                                  </span>
                                  <div className="min-w-0">
                                    <h5 className="text-xs font-bold text-white truncate">
                                      {outline.title}
                                    </h5>
                                    <p className="text-[11px] text-zinc-400 truncate max-w-lg">
                                      {outline.premise}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                  {/* Duration Badge */}
                                  {durationText && (
                                    <span className="text-[11px] px-2 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-zinc-500" />
                                      {durationText}
                                    </span>
                                  )}

                                  {/* Premium / Free Toggle */}
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePremium(epNum)}
                                    title="Clique para alternar entre Gratuito e Premium"
                                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                                      isPremium
                                        ? 'bg-amber-950/50 hover:bg-amber-900/60 border-amber-800/80 text-amber-300'
                                        : 'bg-emerald-950/50 hover:bg-emerald-900/60 border-emerald-800/80 text-emerald-300'
                                    }`}
                                  >
                                    {isPremium ? (
                                      <>
                                        <Lock className="w-3 h-3 text-amber-400" />
                                        <span>Premium (Assinantes)</span>
                                      </>
                                    ) : (
                                      <>
                                        <Unlock className="w-3 h-3 text-emerald-400" />
                                        <span>Gratuito (Degustação)</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>

                              {/* Audio Section: Player or Upload Dropzone */}
                              <div className="pt-2 border-t border-zinc-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {hasAudio ? (
                                  <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
                                    <audio
                                      key={scriptData.audioUrl}
                                      controls
                                      preload="metadata"
                                      src={scriptData.audioUrl}
                                      className="w-full sm:max-w-md h-8 rounded-lg bg-zinc-950 border border-zinc-800"
                                    />
                                    {uploadedSuccessEp === epNum ? (
                                      <span className="text-[11px] text-emerald-300 bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 rounded-md flex items-center gap-1 font-semibold animate-pulse shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        Substituído com sucesso!
                                      </span>
                                    ) : (
                                      <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium shrink-0">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        Áudio pronto
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                    <span>Nenhum áudio importado para este episódio.</span>
                                  </div>
                                )}

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* Copy Script Button */}
                                  {scriptData?.fullScript && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCopyCleanScript(epNum)}
                                      className={`h-7 px-2.5 text-[11px] gap-1.5 transition-all ${
                                        copiedScriptEp === epNum
                                          ? 'border-emerald-600 bg-emerald-950/40 text-emerald-300'
                                          : 'border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                      }`}
                                    >
                                      {copiedScriptEp === epNum ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                          Copiado!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3 text-purple-400" />
                                          Copiar Falas
                                        </>
                                      )}
                                    </Button>
                                  )}

                                  {/* Upload Audio File */}
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept="audio/*"
                                      disabled={uploadingAudioEp === epNum}
                                      onClick={(e) => {
                                        (e.target as HTMLInputElement).value = '';
                                      }}
                                      onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleUploadAudio(epNum, f);
                                      }}
                                      className="hidden"
                                    />
                                    <span
                                      className={`inline-flex items-center gap-1.5 h-7 px-3 text-[11px] font-semibold rounded-lg transition-colors border shadow-sm cursor-pointer ${
                                        hasAudio
                                          ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                                          : 'bg-purple-950/60 hover:bg-purple-900/70 text-purple-200 border-purple-800/80'
                                      }`}
                                    >
                                      {uploadingAudioEp === epNum ? (
                                        <>
                                          <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                                          Processando Áudio...
                                        </>
                                      ) : (
                                        <>
                                          <Upload className="w-3 h-3 text-purple-400" />
                                          {hasAudio ? 'Substituir Áudio' : 'Importar Áudio (.mp3)'}
                                        </>
                                      )}
                                    </span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation footer */}
                  <div className="pt-4 flex items-center justify-between border-t border-zinc-800/80">
                    <Button
                      variant="outline"
                      onClick={() => setActiveStep('scripts')}
                      className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 h-9"
                    >
                      ← Voltar aos Roteiros
                    </Button>

                    <Button
                      onClick={() => setActiveStep('publish')}
                      className="gap-2 bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold px-5 rounded-xl shadow-md h-9"
                    >
                      Avançar para Publicação no App
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })()}

            {/* ======================================================== */}
            {/* ETAPA 5: PUBLICAÇÃO NO BACKEND */}
            {/* ======================================================== */}
            {bible && activeStep === 'publish' && (() => {
              const totalEps = bible.episodeOutlines.length;
              const readyAudioCount = bible.episodeOutlines.filter(
                (ep) => scripts[ep.episodeNumber]?.audioUrl,
              ).length;
              const freeCount = bible.episodeOutlines.filter((ep) => {
                const s = scripts[ep.episodeNumber];
                return s?.isPremium !== undefined ? !s.isPremium : ep.episodeNumber === 1;
              }).length;
              const premiumCount = totalEps - freeCount;
              const totalDurationSeconds = bible.episodeOutlines.reduce((acc, ep) => {
                return acc + (scripts[ep.episodeNumber]?.durationSeconds || 480);
              }, 0);
              const totalMinutes = Math.round(totalDurationSeconds / 60);

              return (
                <div className="space-y-6">
                  <Card className="bg-[#141418]/90 border-zinc-800/80 rounded-2xl p-6 space-y-6 shadow-xl">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Send className="w-5 h-5 text-emerald-400" />
                        <span>Publicar Série no App AudioFic</span>
                      </h3>
                      <p className="text-xs text-zinc-400 pt-1">
                        A história será inserida no banco de dados e ficará visível imediatamente para os ouvintes no aplicativo mobile.
                      </p>
                    </div>

                    {/* Series Preview Banner */}
                    <div className="flex flex-col sm:flex-row gap-5 p-4 rounded-xl bg-zinc-950/80 border border-zinc-800">
                      <div className="w-24 h-36 sm:w-28 sm:h-40 rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0 shadow-md">
                        {bible.coverUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={bible.coverUrl}
                            alt={bible.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-zinc-600 space-y-1">
                            <ImageIcon className="w-6 h-6" />
                            <span className="text-[10px]">Sem Capa</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-rose-950/80 text-rose-300 border-rose-800/50 text-[10px]">
                            {bible.genre}
                          </Badge>
                          <span className="text-[11px] text-zinc-500 font-mono">
                            Temporada 1
                          </span>
                        </div>

                        <h4 className="text-base font-bold text-white leading-tight">
                          {bible.title}
                        </h4>

                        <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                          {bible.logline}
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px]">
                          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                            <span className="text-zinc-500 block">Episódios</span>
                            <span className="font-semibold text-zinc-200">{totalEps} no total</span>
                          </div>
                          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                            <span className="text-zinc-500 block">Áudios Prontos</span>
                            <span className={`font-semibold ${readyAudioCount === totalEps ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {readyAudioCount} de {totalEps}
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                            <span className="text-zinc-500 block">Monetização</span>
                            <span className="font-semibold text-zinc-200">
                              {freeCount} Grátis / {premiumCount} Prem.
                            </span>
                          </div>
                          <div className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                            <span className="text-zinc-500 block">Duração Total</span>
                            <span className="font-semibold text-zinc-200">~{totalMinutes} min</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Warning if episodes without audio */}
                    {readyAudioCount < totalEps && (
                      <div className="p-3.5 rounded-xl border border-amber-900/50 bg-amber-950/20 text-amber-300 text-xs flex items-center gap-2.5">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          <strong>{totalEps - readyAudioCount} episódios</strong> ainda não possuem arquivo de áudio carregado. Você pode publicar agora e importar os áudios a qualquer momento.
                        </span>
                      </div>
                    )}

                    {/* Episodes Breakdown Table */}
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                        Checklist dos Episódios para Envio
                      </h5>

                      <div className="rounded-xl border border-zinc-800 overflow-hidden divide-y divide-zinc-800/60 bg-zinc-950/50">
                        {bible.episodeOutlines.map((outline) => {
                          const epNum = outline.episodeNumber;
                          const s = scripts[epNum];
                          const hasAudio = !!s?.audioUrl;
                          const isPrem = s?.isPremium !== undefined ? s.isPremium : epNum > 1;

                          return (
                            <div
                              key={epNum}
                              className="px-4 py-2.5 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="font-mono text-zinc-500 w-5">
                                  #{epNum}
                                </span>
                                <span className="font-medium text-zinc-200 truncate">
                                  {outline.title}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {hasAudio ? (
                                  <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Áudio OK
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-zinc-600" />
                                    Sem áudio
                                  </span>
                                )}

                                {isPrem ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 flex items-center gap-1">
                                    <Lock className="w-2.5 h-2.5" />
                                    Premium
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                                    <Unlock className="w-2.5 h-2.5" />
                                    Grátis
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Publish Footer */}
                    <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-800/60">
                      <Button
                        variant="outline"
                        onClick={() => setActiveStep('audio')}
                        className="text-xs bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 h-10"
                      >
                        ← Voltar ao Áudio & Capa
                      </Button>

                      <Button
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 rounded-xl h-10 shadow-lg shadow-emerald-950/40"
                      >
                        {isPublishing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Publicando no App...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Publicar Série no App AudioFic
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </div>
              );
            })()}
          </div>
        </div>

        {/* --- Antigravity-Style Floating Bottom Prompt Area --- */}
        <div className="absolute bottom-5 inset-x-0 mx-auto max-w-3xl px-6 pointer-events-none z-30">
          <form
            onSubmit={handleGenerateBible}
            className="pointer-events-auto bg-[#18181c]/95 border border-zinc-800/90 rounded-2xl shadow-2xl backdrop-blur-xl p-3 flex flex-col gap-2.5 transition-all focus-within:border-zinc-700"
          >
            <div className="flex items-center gap-2 px-1">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Descreva a ideia da série... (ex: Um farol abandonado que volta a acender sozinho toda vez que alguém se afoga)"
                disabled={isGeneratingBible}
                className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!prompt.trim() || isGeneratingBible}
                className="w-8 h-8 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-white disabled:opacity-30 shrink-0"
              >
                {isGeneratingBible ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/60 text-xs">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap min-w-0">
                <div className="flex items-center gap-1.5">
                  <select
                    value={selectedModel}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedModel(val);
                      try {
                        localStorage.setItem('shortstory_selected_model', val);
                      } catch {}
                      if (val.startsWith('gemini')) {
                        setAiProvider('gemini');
                        try {
                          localStorage.setItem('shortstory_ai_provider', 'gemini');
                        } catch {}
                        if (!geminiApiKey) {
                          setShowSettingsModal(true);
                        }
                      } else {
                        setAiProvider('ollama');
                        try {
                          localStorage.setItem('shortstory_ai_provider', 'ollama');
                        } catch {}
                      }
                    }}
                    className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none hover:border-zinc-700 cursor-pointer font-medium"
                  >
                    <optgroup label="Google Gemini (Nuvem / Sem Loops / Alta Fidelidade)">
                      <option value="gemini-3.8-flash">
                        ✨ Gemini 3.8 Flash {geminiApiKey ? '✓' : '(requer chave)'}
                      </option>
                      <option value="gemini-3.6-flash">
                        ⚡ Gemini 3.6 Flash {geminiApiKey ? '✓' : '(requer chave)'}
                      </option>
                      <option value="gemini-3.5-flash-lite">
                        🚀 Gemini 3.5 Flash-Lite {geminiApiKey ? '✓' : '(requer chave)'}
                      </option>
                      <option value="gemini-3.1-flash-lite">
                        ⚡ Gemini 3.1 Flash-Lite {geminiApiKey ? '✓' : '(requer chave)'}
                      </option>
                    </optgroup>
                    <optgroup label="Ollama Local (Offline / RTX 4060)">
                      {models.map((m) => (
                        <option key={m} value={m}>
                          ⚡ {m}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {selectedModel.startsWith('gemini') && (
                    <button
                      type="button"
                      onClick={() => setShowSettingsModal(true)}
                      className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                        geminiApiKey
                          ? 'bg-purple-950/60 border-purple-800/50 text-purple-300 hover:bg-purple-900/60'
                          : 'bg-amber-950/60 border-amber-800/50 text-amber-300 hover:bg-amber-900/60 animate-pulse'
                      }`}
                      title={
                        geminiApiKey
                          ? 'Chave de API do Gemini ativa'
                          : 'Clique para inserir sua chave do Gemini'
                      }
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{geminiApiKey ? 'Chave OK' : 'Inserir Chave'}</span>
                    </button>
                  )}
                </div>

                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none hover:border-zinc-700 cursor-pointer"
                >
                  {DEFAULT_GENRES.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>

                <select
                  value={episodesCount}
                  onChange={(e) => setEpisodesCount(Number(e.target.value))}
                  className="bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 rounded-lg px-2 py-1 focus:outline-none hover:border-zinc-700 cursor-pointer"
                >
                  <option value={1}>1 Conto Único</option>
                  <option value={3}>3 Episódios</option>
                  <option value={5}>5 Episódios</option>
                  <option value={8}>8 Episódios</option>
                  <option value={10}>10 Episódios</option>
                  <option value={12}>12 Episódios</option>
                  <option value={15}>15 Episódios</option>
                  <option value={20}>20 Episódios (Temporada Completa)</option>
                </select>
              </div>

              <span className="text-[10px] text-zinc-500 font-mono hidden lg:inline shrink-0 whitespace-nowrap">
                Enter ↵ para criar Bíblia
              </span>
            </div>
          </form>
        </div>
      </main>

      {/* --- AI Engine Settings Modal --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Configuração do Motor de Roteiro (IA)</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-zinc-500 hover:text-zinc-300 text-xs px-2 py-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Escolha o Motor de Inteligência Artificial:
              </span>

              {/* Provider 1: Ollama Local */}
              <button
                type="button"
                onClick={() => {
                  setAiProvider('ollama');
                  if (selectedModel.startsWith('gemini')) {
                    const fallback = models.includes('qwen2.5:7b') ? 'qwen2.5:7b' : (models[0] || 'qwen2.5:7b');
                    setSelectedModel(fallback);
                    try {
                      localStorage.setItem('shortstory_selected_model', fallback);
                    } catch {}
                  }
                  try {
                    localStorage.setItem('shortstory_ai_provider', 'ollama');
                  } catch {}
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  aiProvider === 'ollama'
                    ? 'border-rose-500 bg-rose-950/20 shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">Ollama Local (RTX 4060 · 8GB)</span>
                  <Badge variant="outline" className="text-[10px] border-emerald-700 text-emerald-400">
                    Offline / Gratuito
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-400 pt-1">
                  Roda direto na sua placa de vídeo com Qwen 2.5 7B. Inclui novo filtro anti-repetição e penalidade por loop.
                </p>
              </button>

              {/* Provider 2: Google Gemini (Recomendado) */}
              <button
                type="button"
                onClick={() => {
                  setAiProvider('gemini');
                  if (!selectedModel.startsWith('gemini')) {
                    setSelectedModel('gemini-3.8-flash');
                    try {
                      localStorage.setItem('shortstory_selected_model', 'gemini-3.8-flash');
                    } catch {}
                  }
                  try {
                    localStorage.setItem('shortstory_ai_provider', 'gemini');
                  } catch {}
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  aiProvider === 'gemini'
                    ? 'border-rose-500 bg-rose-950/20 shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">Google Gemini 3.8 Flash</span>
                  <Badge className="bg-purple-950 text-purple-300 border-purple-800 text-[10px]">
                    Recomendado para Áudio Drama
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-400 pt-1">
                  Modelos Gemini 3.8 Flash, 3.6 Flash e 3.5 Flash-Lite com coerência cinematográfica extrema e sem loops de repetição.
                </p>
              </button>

              {/* Provider 3: NVIDIA NIM */}
              <button
                type="button"
                onClick={() => {
                  setAiProvider('nvidia');
                  try {
                    localStorage.setItem('shortstory_ai_provider', 'nvidia');
                  } catch {}
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all ${
                  aiProvider === 'nvidia'
                    ? 'border-rose-500 bg-rose-950/20 shadow-md'
                    : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">NVIDIA NIM (Llama 3.3 70B Cloud)</span>
                  <Badge variant="outline" className="text-[10px] border-amber-700 text-amber-400">
                    Modelos 70B
                  </Badge>
                </div>
                <p className="text-[11px] text-zinc-400 pt-1">
                  Modelos gigantescos em nuvem rápida da NVIDIA com 1.000 créditos gratuitos de início.
                </p>
              </button>
            </div>

            {/* API Keys Inputs */}
            {aiProvider === 'gemini' && (
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-300">
                    Sua Chave de API do Gemini:
                  </label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Obter Chave Gratuita no Google AI Studio ↗
                  </a>
                </div>
                <Input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => {
                    setGeminiApiKey(e.target.value);
                    try {
                      localStorage.setItem('shortstory_gemini_key', e.target.value);
                    } catch {}
                  }}
                  placeholder="AIzaSy..."
                  className="text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
                />
              </div>
            )}

            {aiProvider === 'nvidia' && (
              <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-300">
                    Sua Chave de API da NVIDIA NIM:
                  </label>
                  <a
                    href="https://build.nvidia.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-rose-400 hover:underline"
                  >
                    Obter Chave no NVIDIA Build ↗
                  </a>
                </div>
                <Input
                  type="password"
                  value={nvidiaApiKey}
                  onChange={(e) => {
                    setNvidiaApiKey(e.target.value);
                    try {
                      localStorage.setItem('shortstory_nvidia_key', e.target.value);
                    } catch {}
                  }}
                  placeholder="nvapi-..."
                  className="text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
                />
              </div>
            )}

            {/* ElevenLabs API Key Input */}
            <div className="space-y-1.5 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  Chave de API do ElevenLabs (Vozes Cinema-Grade):
                </label>
                <a
                  href="https://elevenlabs.io/app/voice-library"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Obter no ElevenLabs ↗
                </a>
              </div>
              <Input
                type="password"
                value={elevenLabsApiKey}
                onChange={(e) => {
                  setElevenLabsApiKey(e.target.value);
                  try {
                    localStorage.setItem('shortstory_elevenlabs_key', e.target.value);
                  } catch {}
                }}
                placeholder="sk_..."
                className="text-xs bg-zinc-900 border-zinc-800 text-zinc-200"
              />
              <p className="text-[10px] text-zinc-500">
                Utilizada para síntese de vozes ultra-realistas com ElevenLabs Multilingual v2. Se vazia, o estúdio usa vozes neurais locais sem custos.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setShowSettingsModal(false)}
                className="bg-zinc-100 text-zinc-900 hover:bg-white text-xs font-semibold px-4 rounded-xl"
              >
                Concluir & Salvar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
