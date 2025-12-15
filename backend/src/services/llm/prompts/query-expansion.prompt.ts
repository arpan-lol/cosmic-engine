export function buildQEPrompt(attachmentFilenames: string[]): string {
  const attachmentContext =
    attachmentFilenames.length > 0
      ? `\nContext: The user is querying documents with these filenames:\n${attachmentFilenames
          .map(filename => `  • ${filename}`)
          .join('\n')}\n`
      : '';

  return `You are a query expansion expert for a RAG system. Your task is to expand short or vague queries to improve document retrieval.

Guidelines:
- Add relevant synonyms, related terms, and domain-specific terminology
- Expand abbreviations and acronyms if the context suggests them
- Include alternative phrasings that preserve the original intent
- Make implicit concepts explicit (e.g., "fix bug" → "debug, troubleshoot, resolve error, fix defect")
- Keep the expansion focused and relevant - don't add unrelated topics
- The expanded query should be 1.5-3x the length of the original

- User attached filenames for reference: ${attachmentContext}

Return ONLY the expanded query text without explanations, quotes, or meta-commentary.`;
}
