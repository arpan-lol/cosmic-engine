import { GoogleGenAI } from '@google/genai';

type KeyEntry = {
  name: string;
  value: string;
};

let keyIndex = 0;
const clientCache = new Map<string, GoogleGenAI>();

function getKeyEntries(): KeyEntry[] {
  const entries = Object.entries(process.env)
    .filter(([name, value]) => /^GOOGLE_GENAI_API_KEY(?:_\d+)?$/.test(name) && !!value)
    .map(([name, value]) => ({
      name,
      value: value as string,
    }))
    .sort((a, b) => {
      if (a.name === 'GOOGLE_GENAI_API_KEY') return -1;
      if (b.name === 'GOOGLE_GENAI_API_KEY') return 1;
      const aIndex = Number(a.name.match(/_(\d+)$/)?.[1] ?? Number.MAX_SAFE_INTEGER);
      const bIndex = Number(b.name.match(/_(\d+)$/)?.[1] ?? Number.MAX_SAFE_INTEGER);
      return aIndex - bIndex;
    });

  return entries;
}

export function getGeminiKeyNames(): string[] {
  return getKeyEntries().map(entry => entry.name);
}

export function getGeminiClient(): GoogleGenAI {
  const entries = getKeyEntries();

  if (entries.length === 0) {
    throw new Error('No Gemini API keys configured');
  }

  const entry = entries[keyIndex % entries.length];
  keyIndex = (keyIndex + 1) % entries.length;

  const cachedClient = clientCache.get(entry.name);
  if (cachedClient) {
    return cachedClient;
  }

  const client = new GoogleGenAI({
    apiKey: entry.value,
  });

  clientCache.set(entry.name, client);
  return client;
}
