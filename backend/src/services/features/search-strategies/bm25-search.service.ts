import prisma from 'src/prisma/client';
import { tokenize } from '../../../utils/bm25.util'

export class BM25Search {
  static async search(
    attachmentId: string,
    query: string,
    topK: number
  ): Promise<{
    data: Array<{ chunkIndex: number; score: number }>;
    rows: any[];
    scores: Record<number, number>;
  }> {

    const tokens = tokenize(query);

    if (tokens.length === 0) {
      return { data: [], rows: [], scores: {} };
    }

    // 1) get meta
    const meta = await prisma.bM25IndexMeta.findUnique({
      where: { attachmentId },
    });

    if (!meta) {
      return { data: [], rows: [], scores: {} };
    }

    const { totalDocs, avgChunkLength } = meta;

    // 2) get matching rows for query tokens
    const rows = await prisma.bM25IndexEntry.findMany({
      where: {
        attachmentId,
        term: { in: tokens },
      },
    });

    // 3) aggregate BM25 scores by chunk
    const k1 = 1.2;
    const b = 0.75;

    const scores: Record<number, number> = {};

    for (const row of rows) {
      const idf = Math.log(
        (totalDocs - row.df + 0.5) / (row.df + 0.5)
      );

      const tfComponent =
        ((row.tf * (k1 + 1)) /
          (row.tf + k1 * (1 - b + b * (row.chunkLength / avgChunkLength))));

      const score = idf * tfComponent;

      scores[row.chunkIndex] = (scores[row.chunkIndex] || 0) + score;
    }

    const data = Object.entries(scores)
      .map(([chunkIndex, score]) => ({
        chunkIndex: Number(chunkIndex),
        score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return { data, rows, scores };
  }
}
