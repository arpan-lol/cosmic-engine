import { EnhancedContext } from '../../llm/retrieval.service';

export class HybridSearchService {
  static async search(
    sessionId: string,
    query: string,
    attachmentIds: string[]
  ): Promise<EnhancedContext[]> {
    return [];
  }
}
