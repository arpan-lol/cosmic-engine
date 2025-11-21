export const RAG_CONFIG = {
  TOKEN_BUDGET: 150000,
  EST_TOKENS_PER_CHUNK: 500,
  CHUNK_SIZE: 2000,
  MIN_CHUNKS_PER_DOC: 3,
  MAX_TOTAL_CHUNKS: 50,
  MAX_CHUNKS_PER_DOC: 15,
  SAFETY_MARGIN: 0.85,
} as const;

export function dynamicTopK(attachmentCount: number): number {
  if (attachmentCount === 0) {
    return 0;
  }

  const maxChunksFormula = Math.floor(
    (RAG_CONFIG.TOKEN_BUDGET * RAG_CONFIG.SAFETY_MARGIN) / RAG_CONFIG.EST_TOKENS_PER_CHUNK
  );

  let topK: number;

  if (attachmentCount === 1) {
    topK = Math.min(
      RAG_CONFIG.MAX_CHUNKS_PER_DOC,
      maxChunksFormula,
      RAG_CONFIG.MAX_TOTAL_CHUNKS
    );
  } else {
    const chunksPerDoc = Math.max(
      RAG_CONFIG.MIN_CHUNKS_PER_DOC,
      Math.floor(maxChunksFormula / attachmentCount)
    );
    
    const cappedChunksPerDoc = Math.min(chunksPerDoc, RAG_CONFIG.MAX_CHUNKS_PER_DOC);
    
    topK = Math.min(
      cappedChunksPerDoc * attachmentCount,
      RAG_CONFIG.MAX_TOTAL_CHUNKS
    );
  }

  console.log(
    `[RAG Config] Calculated topK=${topK} for ${attachmentCount} attachment(s) ` +
      `(max from budget: ${maxChunksFormula}, per doc: ${Math.floor(topK / attachmentCount)})`
  );

  return Math.max(topK, RAG_CONFIG.MIN_CHUNKS_PER_DOC);
}
