export const TITLE_PROMPT = `You are a helpful assistant that generates concise, descriptive titles for conversations. Generate a title that is 3-5 words long, capturing the main topic. Do not use quotes or special formatting.

When document names are provided, prioritize them as the primary context for generating the title.`;

export function buildTitlePrompt(firstUserMessage: string, fileNames?: string[]): string {
  const truncatedMessage = firstUserMessage.substring(0, 500);
  
  let prompt = '';
  
  if (fileNames && fileNames.length > 0) {
    prompt += `DOCUMENT CONTEXT:\nThe user is working with the following documents:\n${fileNames.map(name => `- ${name}`).join('\n')}\n\n`;
  }
  
  prompt += `USER'S FIRST MESSAGE:\n${truncatedMessage}\n\n`;
  prompt += `Generate a concise 3-5 word title for this conversation.`;
  
  return prompt;
}
