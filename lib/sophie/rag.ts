import { KNOWLEDGE, type KnowledgeChunk } from './knowledge';

/**
 * Recuperación léxica (mini-RAG) para Sophie: normaliza tildes, puntúa tags,
 * título y contenido, y devuelve los chunks más relevantes de la consulta del
 * cliente. Determinista, sin dependencias ni embeddings: el corpus es pequeño
 * y estructurado, y los precios se generan desde el código canónico.
 */

export type RetrievedChunk = KnowledgeChunk & { score: number };

export type RetrieveOptions = {
  topK?: number;
  corpus?: KnowledgeChunk[];
};

const STOPWORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'y', 'o', 'que', 'en', 'con', 'por', 'para', 'del', 'al',
  'es', 'son', 'ser', 'se', 'me', 'te', 'mi', 'tu', 'su', 'sus', 'lo',
  'como', 'the', 'of',
]);

export function normalize(text: string): string {
  return (text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function scoreChunk(chunk: KnowledgeChunk, queryTokens: string[], normalizedQuery: string): number {
  const titleTokens = new Set(tokenize(chunk.title));
  const tagTokens = new Set(chunk.tags.flatMap((tag) => tokenize(tag)));
  const contentTokens = new Set(tokenize(chunk.content));
  let score = 0;

  for (const token of queryTokens) {
    if (tagTokens.has(token)) score += 3;
    else if (titleTokens.has(token)) score += 2;
    else if (contentTokens.has(token)) score += 1;
  }

  // Frases multi-palabra en tags ("cuanto cuesta", "minuto adicional"...).
  for (const tag of chunk.tags) {
    const phrase = normalize(tag).trim();
    if (phrase.includes(' ') && normalizedQuery.includes(phrase)) score += 4;
  }

  return score;
}

export function retrieve(query: string, options: RetrieveOptions = {}): RetrievedChunk[] {
  const { topK = 4, corpus = KNOWLEDGE } = options;
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const normalizedQuery = normalize(query);
  return corpus
    .map((chunk) => ({ ...chunk, score: scoreChunk(chunk, queryTokens, normalizedQuery) }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
    .slice(0, topK);
}
