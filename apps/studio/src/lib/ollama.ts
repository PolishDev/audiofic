export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  details?: {
    parameter_size?: string;
    quantization_level?: string;
    family?: string;
  };
}

const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

/**
 * Fetch available models from local Ollama instance.
 */
export async function getLocalOllamaModels(): Promise<OllamaModel[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    return data.models || [];
  } catch (error) {
    console.warn('[Ollama] Failed to connect to local Ollama:', error);
    return [];
  }
}

/**
 * Generate completion from local Ollama with JSON grammar enforcement and expanded context.
 */
export async function generateWithOllama(params: {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  format?: 'json';
  numCtx?: number;
  numPredict?: number;
}): Promise<string> {
  const res = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: params.model,
      prompt: params.prompt,
      system: params.systemPrompt,
      stream: false,
      format: params.format,
      options: {
        temperature: params.temperature ?? 0.7,
        num_ctx: params.numCtx ?? 8192, // Expands from default 2048 to prevent truncating long episodes
        num_predict: params.numPredict ?? 4096,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.response;
}
