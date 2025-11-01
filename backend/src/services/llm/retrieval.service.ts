export class RetrievalService {
  static async getRelevantContext(
    sessionId: string,
    query: string,
    topK: number = 5
  ): Promise<string[]> {
    throw new Error('Not implemented');
  }
}

