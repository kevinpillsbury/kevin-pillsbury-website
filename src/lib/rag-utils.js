/**
 * RAG utilities shared by the API route and deploy-time indexing script.
 * Plain JS so it can be executed by Node during Vercel builds.
 */

/**
 * Split plain text into paragraphs. Paragraphs are separated by one-or-more blank lines.
 * @param {string} text
 * @returns {string[]}
 */
export function splitParagraphs(text) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  return normalized
    .split(/\n\s*\n+/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Pack paragraphs into chunks so dialogue-heavy text doesn't become tiny chunks.
 * Uses character counts as a cheap approximation of token budgets.
 * @param {string[]} paragraphs
 * @param {{ targetChars: number, maxChars: number }} opts
 * @returns {string[]}
 */
export function packParagraphs(paragraphs, opts) {
  const targetChars = opts?.targetChars ?? 3500;
  const maxChars = opts?.maxChars ?? 4500;
  /** @type {string[]} */
  const chunks = [];
  /** @type {string[]} */
  let current = [];
  let currentLen = 0;

  const flush = () => {
    if (current.length === 0) return;
    chunks.push(current.join('\n\n').trim());
    current = [];
    currentLen = 0;
  };

  for (const para of paragraphs) {
    const p = String(para ?? '').trim();
    if (!p) continue;

    // If a single paragraph is huge, split it on lines to keep within maxChars.
    if (p.length > maxChars) {
      flush();
      const lines = p.split('\n').map((l) => l.trim()).filter(Boolean);
      let buf = '';
      for (const line of lines) {
        const next = buf ? `${buf}\n${line}` : line;
        if (next.length > maxChars) {
          if (buf) chunks.push(buf);
          buf = line;
        } else {
          buf = next;
        }
      }
      if (buf) chunks.push(buf);
      continue;
    }

    const separator = current.length === 0 ? 0 : 2; // "\n\n"
    const nextLen = currentLen + separator + p.length;
    if (nextLen <= targetChars) {
      current.push(p);
      currentLen = nextLen;
      continue;
    }

    // If we haven't hit maxChars yet, allow a bit of overshoot to reduce chunk count.
    if (nextLen <= maxChars) {
      current.push(p);
      currentLen = nextLen;
      flush();
      continue;
    }

    flush();
    current.push(p);
    currentLen = p.length;
  }

  flush();
  return chunks.filter(Boolean);
}

/**
 * Build chunks for a composition.
 * - Poetry: always 1 chunk (keep the whole piece intact)
 * - Other genres: paragraph-aware packing
 *
 * @param {{ title: string, content: string, genre: string }} composition
 * @returns {string[]}
 */
export function chunkComposition(composition) {
  const content = String(composition?.content ?? '').replace(/\r\n/g, '\n').trim();
  const genre = String(composition?.genre ?? '').toLowerCase().trim();

  if (!content) return [];
  if (genre === 'poetry') return [content];

  const paragraphs = splitParagraphs(content);
  if (paragraphs.length <= 1) return [content];

  // Dialogue-heavy prose often has short paragraphs; packing prevents tiny chunks.
  return packParagraphs(paragraphs, { targetChars: 3200, maxChars: 4800 });
}

/**
 * Normalize an embedding vector to unit length.
 * @param {number[]} values
 * @returns {number[]}
 */
export function normalizeEmbedding(values) {
  const v = (values ?? []).map((x) => Number(x));
  let sumSq = 0;
  for (const x of v) sumSq += x * x;
  const norm = Math.sqrt(sumSq);
  if (!Number.isFinite(norm) || norm === 0) return v;
  return v.map((x) => x / norm);
}

/**
 * Format an embedding as a pgvector literal.
 * @param {number[]} values
 * @returns {string}
 */
export function toVectorLiteral(values) {
  // Keep a stable, compact string; pgvector accepts text like "[0.1,0.2,...]".
  return `[${(values ?? []).map((x) => Number(x).toFixed(8)).join(',')}]`;
}

