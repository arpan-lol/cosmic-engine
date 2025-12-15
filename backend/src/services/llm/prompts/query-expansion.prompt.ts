export function buildQEPrompt(attachmentFilenames: string[]): string {
  const attachmentContext =
    attachmentFilenames.length > 0
      ? `The query may be related to the following document names:\n${attachmentFilenames
          .map(filename => `- ${filename}`)
          .join('\n')}\n\n`
      : '';

  return `You are a query expansion expert.
Expand the following query by adding related terms, synonyms, and contextual details that preserve the original intent. ${attachmentContext}
Return only the expanded query without explanations.`;
}
