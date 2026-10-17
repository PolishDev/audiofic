export interface AIProviderConfig {
  provider: 'ollama' | 'gemini' | 'nvidia';
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

// Active Google Gemini model cascade in order of speed and availability
const GEMINI_CASCADE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

/**
 * Prunes repetitive loops from LLM outputs (e.g. repeated cues or oscillating dialogue).
 */
export function pruneRepetitiveLoops(text: string): string {
  const parts = text.split(/(?<=[.!?\]])\s+/);
  const cleaned: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    if (!part) continue;

    const n = cleaned.length;
    // 1-part immediate duplicate: A A
    if (n >= 1 && part === cleaned[n - 1]) {
      continue;
    }

    // 2-part oscillation: A B A B
    if (n >= 2 && part === cleaned[n - 2]) {
      if (n >= 3 && cleaned[n - 1] === cleaned[n - 3]) {
        break; // Loop detected, stop cleanly
      }
    }

    // 3-part oscillation: A B C A B C
    if (n >= 4 && part === cleaned[n - 3] && cleaned[n - 1] === cleaned[n - 4]) {
      break;
    }

    cleaned.push(part);
  }

  return cleaned.join('\n\n');
}

/**
 * Executes a call to the local Ollama instance on RTX 4060
 */
async function callOllama(params: {
  model?: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  format?: 'json';
}): Promise<string> {
  const modelName = params.model || 'qwen2.5:7b';
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      prompt: params.prompt,
      system: params.systemPrompt,
      stream: false,
      format: params.format,
      options: {
        temperature: params.temperature ?? 0.7,
        repeat_penalty: 1.18, // Essential: prevents Qwen from looping sentences
        repeat_last_n: 256,
        num_ctx: 16384,
        num_predict: 6144,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return pruneRepetitiveLoops(data.response);
}

/**
 * Universal text generation function supporting Ollama, Gemini and NVIDIA NIM.
 * Features automated multi-tier fallback cascade (e.g. 503 high demand -> 3.6-flash -> 3.5-flash-lite -> Ollama).
 */
export async function generateContentWithAI(params: {
  provider?: 'ollama' | 'gemini' | 'nvidia';
  model?: string;
  apiKey?: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  format?: 'json';
}): Promise<string> {
  const provider = params.provider || (process.env.DEFAULT_AI_PROVIDER as 'ollama' | 'gemini' | 'nvidia') || 'ollama';

  // 1. Google Gemini API with automated Cascade Fallback and Retry
  if (provider === 'gemini') {
    const key = params.apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('Chave de API do Gemini (GEMINI_API_KEY) não configurada.');
    }

    const requestedModel = params.model || 'gemini-3.8-flash';
    // Order: requested model first, then the remaining cascade models without duplicates
    const modelQueue: string[] = [
      requestedModel,
      ...GEMINI_CASCADE_MODELS.filter((m) => m !== requestedModel),
    ];

    const contents: any[] = [];
    if (params.systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: `INSTRUÇÕES DE SISTEMA:\n${params.systemPrompt}\n\nResponda estritamente à tarefa a seguir.` }],
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Entendido. Agirei rigorosamente conforme as instruções.' }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: params.prompt }],
    });

    const body: any = {
      contents,
      generationConfig: {
        temperature: params.temperature ?? 0.7,
        maxOutputTokens: 8192,
      },
    };

    if (params.format === 'json') {
      body.generationConfig.responseMimeType = 'application/json';
    }

    let lastError: Error | null = null;

    for (let i = 0; i < modelQueue.length; i++) {
      const currentModel = modelQueue[i];
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${key}`;

      // Try primary model up to 2 times (1 immediate, 1 retry after backoff if 503/429)
      const maxAttempts = i === 0 ? 2 : 1;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

          if (res.ok) {
            const data = await res.json();
            const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidate) {
              if (i > 0) {
                console.log(
                  `[Gemini Fallback Sucesso] Modelo original (${requestedModel}) indisponível. Gerado com sucesso pelo modelo reserva: ${currentModel}.`,
                );
              }
              return pruneRepetitiveLoops(candidate);
            }
            throw new Error(`Gemini (${currentModel}) retornou uma resposta vazia`);
          }

          const status = res.status;
          const errText = await res.text();
          lastError = new Error(`Erro Gemini ${currentModel} (${status}): ${errText}`);

          const isOverloaded = status === 503 || status === 429 || status >= 500;

          if (isOverloaded) {
            if (attempt < maxAttempts) {
              console.warn(
                `[Gemini ${currentModel}] Sobrecarga temporária (${status}). Aguardando 1.5s antes da 2ª tentativa...`,
              );
              await new Promise((r) => setTimeout(r, 1500));
              continue;
            } else if (i < modelQueue.length - 1) {
              const nextModel = modelQueue[i + 1];
              console.warn(
                `[Gemini Fallback Ativado] ${currentModel} sobrecarregado (${status}). Acionando modelo reserva: ${nextModel}...`,
              );
              break; // Proceed to next model in cascade
            }
          }

          // If client error that is not overload (e.g. 400 bad request, 403 invalid key), don't loop endlessly
          if (!isOverloaded && status !== 404) {
            throw lastError;
          }
        } catch (fetchErr: any) {
          lastError = fetchErr;
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 1200));
            continue;
          }
        }
      }
    }

    // Safety net: If all cloud Gemini models hit 503/429 or are unavailable, try local Ollama
    console.warn(
      `[AI Cascade] Todos os modelos Gemini da nuvem falharam. Tentando resgatar com Ollama local (Qwen 2.5 7B)...`,
    );
    try {
      const fallbackOllamaResult = await callOllama({
        model: 'qwen2.5:7b',
        prompt: params.prompt,
        systemPrompt: params.systemPrompt,
        temperature: params.temperature,
        format: params.format,
      });
      console.log(`[AI Cascade] Resgate pelo Ollama local concluído com sucesso!`);
      return fallbackOllamaResult;
    } catch {
      // If Ollama is also down, throw the descriptive Gemini error
      throw lastError || new Error('Falha ao gerar conteúdo em todos os modelos Gemini e Ollama.');
    }
  }

  // 2. NVIDIA NIM API (Llama 3.3 70B / Qwen 2.5 72B)
  if (provider === 'nvidia') {
    const key = params.apiKey || process.env.NVIDIA_API_KEY;
    if (!key) {
      throw new Error('Chave de API do NVIDIA NIM (NVIDIA_API_KEY) não configurada.');
    }
    const modelName = params.model || 'meta/llama-3.3-70b-instruct';
    const url = 'https://integrate.api.nvidia.com/v1/chat/completions';

    const messages = [];
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }
    messages.push({ role: 'user', content: params.prompt });

    const body: any = {
      model: modelName,
      messages,
      temperature: params.temperature ?? 0.7,
      max_tokens: 6144,
    };
    if (params.format === 'json') {
      body.response_format = { type: 'json_object' };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Erro NVIDIA NIM (${res.status}): ${err}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    return pruneRepetitiveLoops(text);
  }

  // 3. Local Ollama (Default offline with repeat_penalty anti-loop)
  return callOllama({
    model: params.model,
    prompt: params.prompt,
    systemPrompt: params.systemPrompt,
    temperature: params.temperature,
    format: params.format,
  });
}
