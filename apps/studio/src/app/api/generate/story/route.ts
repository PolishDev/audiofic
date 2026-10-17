import { NextResponse } from 'next/server';
import { generateWithOllama } from '@/lib/ollama';
import { jsonrepair } from 'jsonrepair';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      prompt,
      genre = 'terror-sobrenatural',
      episodesCount = 3,
      tone = 'sombrio e aterrorizante',
      model = 'qwen2.5:7b',
    } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt é obrigatório' },
        { status: 400 },
      );
    }

    const systemPrompt = `Você é um roteirista premiado e diretor editorial de ficção seriada em áudio (audio dramas e podcasts narrativos de suspense e terror no Brasil).
Sua missão é criar histórias imersivas, tensas, com ganchos fortes entre episódios e ritmo perfeito para narração oral.

REGRAS OBRIGATÓRIAS DE FORMATAÇÃO:
1. Responda ESTRITAMENTE em formato JSON VÁLIDO.
2. NUNCA use aspas duplas (") não-escapadas dentro dos textos. Para falas de personagens e diálogos, utilize SEMPRE travessão (—) ou aspas simples (').
3. Para quebras de linha dentro do texto, use "\\n".

ESTRUTURA JSON ESPERADA:
{
  "title": "Título impactante da história",
  "synopsis": "Sinopse instigante de 2 a 3 frases preparando o mistério.",
  "genreSlugs": ["${genre}"],
  "coverIdea": "Descrição visual sombria para a arte da capa",
  "author": "ShortStory Studio",
  "episodes": [
    {
      "episodeNumber": 1,
      "title": "Título do episódio",
      "synopsis": "Resumo do que acontece neste capítulo",
      "estimatedDuration": "3 min",
      "script": "Texto detalhado da narração com marcações de clima sonoro. Exemplo: A madeira rangeu no andar de cima. [pausa sombria] — Não suba lá —, alertou a voz trêmula do velho."
    }
  ]
}`;

    const userPrompt = `Escreva uma história original seriada com ${episodesCount} episódios baseada nesta premissa:
"${prompt}"

Gênero: ${genre}
Tom narrativo: ${tone}
Quantidade de episódios: ${episodesCount}

Cada episódio deve avançar a trama e terminar com um gancho misterioso (cliffhanger) que instigue a ouvir o seguinte. Responda apenas o JSON.`;

    const rawResponse = await generateWithOllama({
      model,
      prompt: userPrompt,
      systemPrompt,
      format: 'json',
      temperature: 0.7,
      numCtx: 8192,
      numPredict: 4096,
    });

    // Clean markdown code blocks if present
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

    // 1. Direct parse attempt
    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json({ success: true, story: parsedData });
    } catch {
      // 2. Intelligent JSON repair fallback (fixes unescaped quotes, trailing commas, truncated brackets)
      try {
        const repaired = jsonrepair(cleanJson);
        const parsedData = JSON.parse(repaired);
        return NextResponse.json({ success: true, story: parsedData });
      } catch {
        // 3. Regex extraction + repair fallback
        const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const repairedMatch = jsonrepair(jsonMatch[0]);
            const parsedData = JSON.parse(repairedMatch);
            return NextResponse.json({ success: true, story: parsedData });
          } catch (repairError) {
            console.error('[API /generate/story] jsonrepair failed:', repairError);
          }
        }

        return NextResponse.json(
          {
            error: 'O modelo gerou um JSON com formatação corrompida. Tente gerar novamente.',
            raw: cleanJson.slice(0, 1000),
          },
          { status: 422 },
        );
      }
    }
  } catch (error) {
    console.error('[API /generate/story] Unexpected error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Falha na geração com Ollama',
      },
      { status: 500 },
    );
  }
}
