import { EnhancedContext } from '../../llm/retrieval.service';
import { BM25Search } from './bm25-search.service';
import { SearchService } from '../../milvus/index';
import { dynamicTopK } from '../../../config/rag.config';
import prisma from 'src/prisma/client';
import { NotFoundError, ValidationError } from 'src/types/errors';

interface HybridHit {
  attachmentId: string;
  chunkIndex: number;
  vectorScore?: number;
  bm25Score?: number;
}

export class HybridSearchService {
  static async search(
    sessionId: string,
    query: string,
    attachmentIds: string[]
  ): Promise<EnhancedContext[]> {

    const totalTopK = dynamicTopK(attachmentIds.length);
    const topKPerDoc = Math.ceil(totalTopK / attachmentIds.length);

    console.log(
      `[HybridSearch] Searching ${attachmentIds.length} attachment(s) with topK=${totalTopK} (${topKPerDoc} per doc)`
    );

    const hybridMap = new Map<string, HybridHit>();

    for (const attachmentId of attachmentIds) {

      const dbData = await prisma.attachment.findFirst({
        where: {
          id: attachmentId
        }
      });

      if (!dbData) {
        throw new NotFoundError(`Attachment ${attachmentId} not found`);
      }    

    // "not started" (or null) - Initial state when attachment is uploaded
    // "queued" - Set when indexing job is queued via the BM25 controller
    // "processing" - Set when the background worker starts processing
    // "completed" - Successfully indexed and ready for hybrid search
    // "failed" - Indexing failed due to an error
    
      if(dbData.bm25indexStatus !== "completed"){
        throw new ValidationError("All files must be BM25 indexed before using hybrid search!")
      }

      const [vecHits, bmHits] = await Promise.all([
        SearchService.search(sessionId, query, topKPerDoc, attachmentId),
        BM25Search.search(attachmentId, query, topKPerDoc),
      ]);

      for (const hit of vecHits) {
        const key = `${hit.attachmentId}:${hit.chunkIndex}`;
        const existing = hybridMap.get(key) || {
          attachmentId: hit.attachmentId,
          chunkIndex: hit.chunkIndex,
        };
        existing.vectorScore = hit.score;
        hybridMap.set(key, existing);
      }

      for (const hit of bmHits) {
        const key = `${attachmentId}:${hit.chunkIndex}`;
        const existing = hybridMap.get(key) || {
          attachmentId,
          chunkIndex: hit.chunkIndex,
        };
        existing.bm25Score = hit.score;
        hybridMap.set(key, existing);
      }
    }

    const allHits = Array.from(hybridMap.values());

    const vectorScores = allHits.map((h) => h.vectorScore ?? 0).filter((s) => s > 0);
    const bm25Scores = allHits.map((h) => h.bm25Score ?? 0).filter((s) => s > 0);

    const minVector = Math.min(...vectorScores, 0);
    const maxVector = Math.max(...vectorScores, 0);
    const minBM25 = Math.min(...bm25Scores, 0);
    const maxBM25 = Math.max(...bm25Scores, 0);

    const alpha = 0.7;
    const beta = 0.3;

    const rankedHits = allHits.map((hit) => {
      const vectorNorm =
        hit.vectorScore !== undefined
          ? (hit.vectorScore - minVector) / (maxVector - minVector || 1)
          : 0;
      const bm25Norm =
        hit.bm25Score !== undefined
          ? (hit.bm25Score - minBM25) / (maxBM25 - minBM25 || 1)
          : 0;

      const finalScore = alpha * vectorNorm + beta * bm25Norm;

      return { ...hit, finalScore };
    });

    rankedHits.sort((a, b) => b.finalScore - a.finalScore);

    const topHits = rankedHits.slice(0, totalTopK);

    const contextPromises = topHits.map(async (hit) => {
      const vecHits = await SearchService.search(sessionId, '', 1, hit.attachmentId);
      const vecHit = vecHits.find((v) => v.chunkIndex === hit.chunkIndex);

      if (!vecHit) {
        return null;
      }

      const context: EnhancedContext = {
        content: vecHit.content,
        attachmentId: hit.attachmentId,
        filename: vecHit.filename,
        chunkIndex: hit.chunkIndex,
        pageNumber: vecHit.pageNumber,
      };

      return context;
    });

    const contexts = await Promise.all(contextPromises);

    const validContexts = contexts.filter((ctx) => ctx !== null);

    console.log(
      `[HybridSearch] Retrieved ${validContexts.length} hybrid-ranked context chunks from ${attachmentIds.length} attachments`
    );

    return validContexts;
  }
}
