import { NextResponse } from 'next/server';
import { generateContentWithAI } from '@/lib/ai-provider';
import { jsonrepair } from 'jsonrepair';

function extractScriptFromRaw(cleanJson: string): string {
  // Find where fullScript starts
  const match = cleanJson.match(/"fullScript"\s*:\s*"/i);
  if (!match || typeof match.index !== 'number') {
    return cleanJson;
  }
  const startIdx = match.index + match[0].length;
  let text = cleanJson.slice(startIdx);

  // Check if there are other keys AFTER fullScript, e.g. ", "wordCount":
  const nextKeyMatch = text.match(/",\s*"[a-zA-Z0-9_]+"\s*:/);
  if (nextKeyMatch && typeof nextKeyMatch.index === 'number') {
    text = text.slice(0, nextKeyMatch.index);
  } else {
    // If it's the last key, find the last '}'
    const endBraceIdx = text.lastIndexOf('}');
    if (endBraceIdx >= 0) {
      text = text.slice(0, endBraceIdx);
    }
    text = text.trim();
    if (text.endsWith('"')) {
      text = text.slice(0, -1);
    }
  }

  return text
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\t/g, '\t')
    .trim();
}

function extractScriptText(
  rawVal: unknown,
  outline: { premise: string; turningPoint: string; cliffhanger: string },
): string {
  if (typeof rawVal === 'string' && rawVal.trim().length > 0) {
    return rawVal.trim();
  }

  if (Array.isArray(rawVal)) {
    return rawVal
      .map((item) => {
        if (typeof item === 'string') return item.trim();
        if (item && typeof item === 'object') {
          const rec = item as Record<string, unknown>;
          if (rec.speaker && rec.dialogue) return `— ${rec.speaker}: ${rec.dialogue}`;
          if (rec.character && rec.line) return `— ${rec.character}: ${rec.line}`;
          if (rec.personagem && rec.fala) return `— ${rec.personagem}: ${rec.fala}`;
          if (rec.scene && rec.narration) return `[${rec.scene}]\n${rec.narration}`;
          if (rec.narration) return String(rec.narration);
          if (rec.text) return String(rec.text);
          if (rec.fala) return String(rec.fala);
          return Object.values(rec).map(String).join('\n');
        }
        return String(item);
      })
      .filter((s) => s.length > 0)
      .join('\n\n');
  }

  if (rawVal && typeof rawVal === 'object') {
    return Object.entries(rawVal as Record<string, unknown>)
      .map(([key, val]) => {
        if (typeof val === 'string') return `[${key.toUpperCase()}]\n${val}`;
        if (val && typeof val === 'object') return extractScriptText(val, outline);
        return String(val);
      })
      .join('\n\n');
  }

  return `${outline.premise}\n\n[MUDANÇA DE TENSÃO]\n${outline.turningPoint}\n\n[CLÍMAX FINAL]\n${outline.cliffhanger}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      bible,
      episodeNumber = 1,
      episodeOutline,
      previousEpisodesSummaries = [],
      directorNotes = '',
      targetDurationMinutes = 10,
      provider = 'ollama',
      model = 'qwen2.5:7b',
      apiKey = '',
    } = body;

    if (!bible || !episodeOutline) {
      return NextResponse.json(
        { error: 'Bíblia e outline do episódio são obrigatórios' },
        { status: 400 },
      );
    }

    const estimatedWords = Math.round(targetDurationMinutes * 140); // ~140 palavras faladas por minuto

    const systemPrompt = `Você é um showrunner sênior e mestre em roteiro de audio drama de terror e suspense psicológico.
Sua missão é escrever o ROTEIRO INTEGRAL do Episódio ${episodeNumber}.

PROTOCOLO OBRIGATÓRIO DE CONTINUIDADE E QUALIDADE NARRATIVA:
1. PROIBIDO TELETRANSPORTE DE PERSONAGENS:
   - Respeite rigorosamente onde cada personagem terminou no episódio anterior.
   - Personagens não podem surgir subitamente em novos locais fechados ou cidades distantes sem justificativa plausível de transporte ou chegada narrada.
2. CONTINUIDADE DOS FATOS E GANCHOS EMOCIONAIS:
   - Se o protagonista possui um trauma, segredo ou descobriu algo no episódio anterior (como fotografias antigas ou itens proibidos), esse elemento DEVE ser sentido e mencionado neste capítulo.
3. HORROR ATMOSFÉRICO E ENTIDADES:
   - Entidades e ameaças sobrenaturais NUNCA devem agir de forma casual, cooperativa ou burocrática. Preserve o terror do desconhecido, o medo e o perigo palpável.
4. PROGRESSÃO SEM LOOPS:
   - Cada cena deve movimentar a trama adiante com novas revelações. NUNCA repita a mesma troca de falas ou a mesma ação de cena consecutivas vezes.
5. REGRA DAS ASPAS E FORMATO:
   - NUNCA use aspas duplas (") dentro do texto falado ou narração. Para diálogos use SEMPRE travessão (—). Para pensamentos ou objetos citados use aspas simples (').
   - O campo "fullScript" DEVE SER UMA STRING ÚNICA com todo o texto corrido, incluindo indicações de som entre colchetes como: [pausa tensa de 2s], [vento uivando lá fora], [sussurro rouco ao ouvido].

ESTRUTURA JSON ESPERADA:
{
  "episodeNumber": ${episodeNumber},
  "title": "${episodeOutline.title}",
  "synopsis": "${episodeOutline.premise}",
  "wordCount": 1500,
  "estimatedDuration": "${targetDurationMinutes} min",
  "fullScript": "Texto completo e cinematográfico da narração e diálogos com todas as cenas até o cliffhanger final..."
}`;

    const charactersContext = bible.characters
      ?.map(
        (c: { name: string; role: string; personality: string; secret?: string; voiceProfile?: string }) =>
          `• ${c.name} (${c.role}): ${c.personality}. Segredo/Culpa: ${c.secret || 'Nenhum'}. Tom de Voz: ${c.voiceProfile || 'natural'}.`,
      )
      .join('\n');

    const rulesContext = bible.universeRules?.join('\n• ');

    const previousContext =
      previousEpisodesSummaries.length > 0
        ? `FATOS E SITUAÇÃO EXATA DE ONDE OS PERSONAGENS PARARAM:\n${previousEpisodesSummaries.join('\n\n')}\n`
        : 'Este é o primeiro episódio da série. Estabeleça o mistério inicial e apresente os personagens com impacto.\n';

    const notesContext = directorNotes.trim()
      ? `\nDIRETRIZES DO DIRETOR PARA ESTE EPISÓDIO:\n"${directorNotes}"\n`
      : '';

    const userPrompt = `Escreva o roteiro completo, denso e aterrorizante para o Episódio ${episodeNumber}: "${episodeOutline.title}".

BÍBLIA DA SÉRIE:
Título: ${bible.title}
Premissa Geral: ${bible.logline || bible.synopsis}
Tom: ${bible.tone}

PERSONAGENS E SEUS SEGREDOS:
${charactersContext}

REGRAS DO SOBRENATURAL / UNIVERSO:
• ${rulesContext}

${previousContext}${notesContext}
OUTLINE PLANEJADO DO EPISÓDIO ${episodeNumber}:
- Começo: ${episodeOutline.premise}
- Virada / Ponto de Tensão: ${episodeOutline.turningPoint}
- Cliffhanger Obrigatório no Encerramento: ${episodeOutline.cliffhanger}

Importante: Proibido teletransporte de personagens. Conecte de forma lógica e fluida de onde parou o episódio anterior. O fullScript deve ser uma única string contínua, usando travessões (—) para falas. Responda apenas o JSON.`;

    const rawResponse = await generateContentWithAI({
      provider,
      model,
      apiKey,
      prompt: userPrompt,
      systemPrompt,
      format: 'json',
      temperature: 0.72,
    });

    let cleanJson = rawResponse.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.slice(7);
    } else if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.slice(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.slice(0, -3);
    }
    cleanJson = cleanJson.trim();

    // 3-tier parsing:
    // Tier 1: JSON.parse
    // Tier 2: jsonrepair
    // Tier 3: extractScriptFromRaw (regex-based extraction immune to unescaped quotes)
    let episodeObj: Record<string, unknown> = {};
    let parseSuccess = false;

    try {
      const parsed = JSON.parse(cleanJson);
      episodeObj = Array.isArray(parsed)
        ? (parsed[0] as Record<string, unknown>)
        : ((parsed.episode || parsed) as Record<string, unknown>);
      parseSuccess = true;
    } catch {
      try {
        const repaired = jsonrepair(cleanJson);
        const parsed = JSON.parse(repaired);
        episodeObj = Array.isArray(parsed)
          ? (parsed[0] as Record<string, unknown>)
          : ((parsed.episode || parsed) as Record<string, unknown>);
        parseSuccess = true;
      } catch (repairErr) {
        console.warn(
          '[API /generate/episode-script] jsonrepair encountered syntax error, using raw extractor:',
          repairErr,
        );
      }
    }

    if (!parseSuccess) {
      // Tier 3: Extract from raw text directly
      const extractedScript = extractScriptFromRaw(cleanJson);
      const epMatch = cleanJson.match(/"episodeNumber"\s*:\s*(\d+)/);
      const titleMatch = cleanJson.match(/"title"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);
      const synMatch = cleanJson.match(/"synopsis"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/);

      episodeObj = {
        episodeNumber: epMatch ? Number(epMatch[1]) : episodeNumber,
        title: titleMatch ? titleMatch[1] : episodeOutline.title,
        synopsis: synMatch ? synMatch[1] : episodeOutline.premise,
        fullScript: extractedScript,
      };
    }

    // Extract script text from all possible LLM keys
    const rawScript =
      episodeObj.fullScript ??
      episodeObj.full_script ??
      episodeObj.script ??
      episodeObj.roteiro ??
      episodeObj.scenes ??
      episodeObj.cenas ??
      episodeObj.content ??
      episodeObj.text ??
      episodeObj.dialogue;

    const normalizedScript = extractScriptText(rawScript, episodeOutline);
    const wordCount = normalizedScript.split(/\s+/).filter(Boolean).length;
    const estMinutes = Math.max(1, Math.round(wordCount / 140));

    const finalEpisode = {
      episodeNumber: Number(episodeObj.episodeNumber || episodeNumber),
      title: String(episodeObj.title || episodeOutline.title || `Episódio ${episodeNumber}`),
      synopsis: String(episodeObj.synopsis || episodeOutline.premise || ''),
      estimatedDuration: String(episodeObj.estimatedDuration || `${estMinutes} min`),
      durationSeconds: estMinutes * 60,
      wordCount,
      fullScript: normalizedScript,
    };

    return NextResponse.json({ success: true, episode: finalEpisode });
  } catch (error) {
    console.error('[API /generate/episode-script] Error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Falha ao gerar roteiro detalhado do episódio',
      },
      { status: 500 },
    );
  }
}
