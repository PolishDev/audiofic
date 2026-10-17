import { NextResponse } from 'next/server';
import { generateContentWithAI } from '@/lib/ai-provider';
import { jsonrepair } from 'jsonrepair';

interface OutlineItem {
  episodeNumber: number;
  title: string;
  premise: string;
  turningPoint: string;
  cliffhanger: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt,
      genre = 'terror-sobrenatural',
      episodesCount = 3,
      tone = 'sombrio, imersivo e perturbador',
      provider = 'ollama',
      model = 'qwen2.5:7b',
      apiKey = '',
    } = body;

    const targetEpisodes = Math.min(20, Math.max(1, Number(episodesCount) || 3));

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Premissa é obrigatória' },
        { status: 400 },
      );
    }

    const systemPrompt = `Você é um showrunner e roteirista chefe premiado de ficção seriada em áudio (áudio-dramas e séries narrativas de terror e suspense).
Sua tarefa é criar a BÍBLIA DA SÉRIE (Show Bible) completa para exatamente ${targetEpisodes} episódios.
A Bíblia servirá de alicerce para garantir que a história mantenha consistência absoluta entre os episódios, sem contradições de personagens, lugares ou regras.

REGRAS OBRIGATÓRIAS:
1. Responda ESTRITAMENTE em formato JSON VÁLIDO.
2. Diálogos e falas devem usar travessão (—) ou aspas simples ('), nunca aspas duplas não-escapadas.
3. O array "episodeOutlines" DEVE CONTER EXATAMENTE ${targetEpisodes} ITENS (do episódio 1 até o ${targetEpisodes}).

ESTRUTURA JSON ESPERADA:
{
  "title": "Título oficial impactante da série",
  "logline": "Frase de efeito / gancho de 1 linha que resume a promessa da história.",
  "synopsis": "Sinopse aprofundada da temporada em 2 parágrafos.",
  "genre": "${genre}",
  "tone": "${tone}",
  "characters": [
    {
      "name": "Nome do personagem",
      "role": "Protagonista / Antagonista / Mentor / Vítima",
      "personality": "Descrição psicológica e modo de falar",
      "secret": "O segredo ou culpa oculta que ele carrega",
      "voiceProfile": "Tom da voz (grave, rouco, sussurrado, acelerado)"
    }
  ],
  "settings": [
    {
      "name": "Nome do local principal (ex: O Farol da Barra Sombria)",
      "sensoryDescription": "Sons, cheiros, luz e atmosfera do ambiente"
    }
  ],
  "universeRules": [
    "Regra 1 sobre como a ameaça/maldição funciona",
    "Regra 2 sobre vulnerabilidades ou limites"
  ],
  "episodeOutlines": [
    {
      "episodeNumber": 1,
      "title": "Título do Episódio 1",
      "premise": "O que acontece no início",
      "turningPoint": "A revelação do meio",
      "cliffhanger": "O gancho chocante final que obriga o ouvinte a dar play no próximo"
    }
  ]
}`;

    const userPrompt = `Crie a Bíblia da Série completa para uma temporada de EXATAMENTE ${targetEpisodes} episódios baseada nesta premissa:
"${prompt}"

Gênero: ${genre}
Tom: ${tone}
Quantidade EXATA de episódios: ${targetEpisodes}

Importante: Certifique-se de listar todos os ${targetEpisodes} episódios no array episodeOutlines, do 1 ao ${targetEpisodes}. Cada episódio deve ter um cliffhanger único e visceral. Responda apenas o JSON.`;

    const rawResponse = await generateContentWithAI({
      provider,
      model,
      apiKey,
      prompt: userPrompt,
      systemPrompt,
      format: 'json',
      temperature: 0.7,
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

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleanJson);
    } catch {
      try {
        const repaired = jsonrepair(cleanJson);
        parsed = JSON.parse(repaired);
      } catch (e) {
        console.warn(
          '[API /generate/bible] jsonrepair failed, attempting sanitization fallback:',
          e,
        );
        try {
          const preSanitized = cleanJson.replace(/(:\s*"[^"]*?)"([^",}\]]*?)"/g, "$1'$2'");
          const repaired = jsonrepair(preSanitized);
          parsed = JSON.parse(repaired);
        } catch {
          parsed = {
            title: prompt.slice(0, 40),
            logline: prompt,
            synopsis: prompt,
            genre,
            tone,
            characters: [],
            settings: [],
            universeRules: [],
            episodeOutlines: [],
          };
        }
      }
    }

    // Ensure episodeOutlines exists and is an array
    if (!parsed.episodeOutlines || !Array.isArray(parsed.episodeOutlines)) {
      parsed.episodeOutlines = [];
    }

    // Normalize existing outlines
    parsed.episodeOutlines = parsed.episodeOutlines.map((item: any, idx: number) => ({
      episodeNumber: Number(item.episodeNumber || idx + 1),
      title: String(item.title || `Episódio ${idx + 1}`),
      premise: String(item.premise || item.synopsis || 'A investigação continua com mistérios crescentes.'),
      turningPoint: String(item.turningPoint || 'Uma revelação perturba o grupo.'),
      cliffhanger: String(item.cliffhanger || 'Um suspense sinistro ecoa na escuridão.'),
    }));

    // Pad if LLM stopped earlier than requested
    if (parsed.episodeOutlines.length < targetEpisodes) {
      const currentCount = parsed.episodeOutlines.length;
      for (let i = currentCount + 1; i <= targetEpisodes; i++) {
        const isClimax = i === targetEpisodes;
        parsed.episodeOutlines.push({
          episodeNumber: i,
          title: isClimax ? `O Confronto Final` : `Capítulo ${i}: As Sombras se Fecham`,
          premise: isClimax
            ? `Todas as pistas convergem para a revelação final da maldição.`
            : `A investigação e o suspense se intensificam à medida que novas ameaças se manifestam.`,
          turningPoint: isClimax
            ? `A verdade aterradora sobre o mistério é exposta sem retorno.`
            : `Uma revelação inesperada abala as certezas dos personagens.`,
          cliffhanger: isClimax
            ? `Um desfecho arrepiante que deixa uma marca eterna na mente dos sobreviventes.`
            : `Um suspense sufocante que obriga a continuar para o próximo capítulo.`,
        });
      }
    }

    // Sort to ensure sequential order 1..targetEpisodes
    parsed.episodeOutlines.sort((a: OutlineItem, b: OutlineItem) => a.episodeNumber - b.episodeNumber);

    return NextResponse.json({ success: true, bible: parsed });
  } catch (error) {
    console.error('[API /generate/bible] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha ao gerar Bíblia da Série',
      },
      { status: 500 },
    );
  }
}
