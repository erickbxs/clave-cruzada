import type { WordMode } from "@/features/room/types";

export interface RoundTheme {
  topic: string;
  word: string;
  decoy: string;
  mode: WordMode;
  hint: string;
}

const localThemes: RoundTheme[] = [
  {
    topic: "Acampamento de verão",
    word: "campfire",
    decoy: "flashlight",
    mode: "different",
    hint: "Uma palavra comum ao grupo",
  },
  {
    topic: "Festa de aniversário",
    word: "bolo",
    decoy: "balão",
    mode: "same",
    hint: "A palavra oficial do grupo",
  },
  {
    topic: "Noite de cinema",
    word: "pipoca",
    decoy: "controle",
    mode: "different",
    hint: "Algo que o time compartilha",
  },
  {
    topic: "Missão espacial",
    word: "astro",
    decoy: "nave",
    mode: "none",
    hint: "Esta palavra pode não ser revelada a todos",
  },
  {
    topic: "Clube dos heróis",
    word: "mascara",
    decoy: "quadrinho",
    mode: "different",
    hint: "Palavra do grupo",
  },
];

function randomItem<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

export async function generateRoundTheme(): Promise<RoundTheme> {
  const fallback = randomItem(localThemes);
  const openAiKey = String(import.meta.env.VITE_OPENAI_API_KEY ?? "").trim();

  if (!openAiKey) {
    return fallback;
  }

  try {
    const providerTheme = await fetchOpenAiTheme(openAiKey);
    if (providerTheme) {
      return providerTheme;
    }
  } catch (error) {
    console.warn("AI provider falhou, usando fallback local:", error);
  }

  return fallback;
}

async function fetchOpenAiTheme(apiKey: string): Promise<RoundTheme | null> {
  const prompt = `Você é um gerador de temas para um jogo de dedução social leve e familiar.
Retorne um JSON simples com os campos: topic, word, decoy, mode e hint.
- topic: nome pequeno do tema
- word: palavra secreta comum para a maioria dos jogadores
- decoy: palavra alternativa para o infiltrado quando o modo for different
- mode: same, different ou none
- hint: frase curta de ajuda para os jogadores

Escolha valores seguros e sem conteúdo sensível.

Exemplo de saída:
{"topic":"Noite de cinema","word":"pipoca","decoy":"controle","mode":"different","hint":"Escolha uma palavra que o time compartilha"}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 120,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text || typeof text !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(text.trim());
    if (
      typeof parsed.topic === "string" &&
      typeof parsed.word === "string" &&
      typeof parsed.decoy === "string" &&
      (parsed.mode === "same" || parsed.mode === "different" || parsed.mode === "none") &&
      typeof parsed.hint === "string"
    ) {
      return {
        topic: parsed.topic,
        word: parsed.word,
        decoy: parsed.decoy,
        mode: parsed.mode,
        hint: parsed.hint,
      };
    }
  } catch {
    return null;
  }

  return null;
}
