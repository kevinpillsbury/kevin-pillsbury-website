/**
 * RAG utilities used by the deploy-time indexing script.
 * Plain JS so it can run in Node during Vercel builds.
 */

export function splitParagraphs(text) {
  const normalized = String(text ?? '').replace(/\r\n/g, '\n').trim();
  if (!normalized) return [];
  return normalized
    .split(/\n\s*\n+/g)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function packParagraphs(paragraphs, opts) {
  const targetChars = opts?.targetChars ?? 3500;
  const maxChars = opts?.maxChars ?? 4500;
  const chunks = [];
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

export function chunkComposition(composition) {
  const content = String(composition?.content ?? '').replace(/\r\n/g, '\n').trim();
  const genre = String(composition?.genre ?? '').toLowerCase().trim();

  if (!content) return [];
  if (genre === 'poetry') return [content];

  const paragraphs = splitParagraphs(content);
  if (paragraphs.length <= 1) return [content];

  return packParagraphs(paragraphs, { targetChars: 3200, maxChars: 4800 });
}

export function normalizeEmbedding(values) {
  const v = (values ?? []).map((x) => Number(x));
  let sumSq = 0;
  for (const x of v) sumSq += x * x;
  const norm = Math.sqrt(sumSq);
  if (!Number.isFinite(norm) || norm === 0) return v;
  return v.map((x) => x / norm);
}

export function toVectorLiteral(values) {
  return `[${(values ?? []).map((x) => Number(x).toFixed(8)).join(',')}]`;
}

