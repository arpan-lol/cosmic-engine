export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function checkContextFitsWindow(promptText: string, maxTokens: number): boolean {
  const estimatedTokens = estimateTokens(promptText);
  const warningThreshold = maxTokens * 0.8;

  if (estimatedTokens > maxTokens) {
    console.warn(
      `[Token Estimator] Context exceeds token limit: ${estimatedTokens} > ${maxTokens}`
    );
    return false;
  }

  if (estimatedTokens > warningThreshold) {
    console.warn(
      `[Token Estimator] Context approaching token limit: ${estimatedTokens} tokens (${Math.round((estimatedTokens / maxTokens) * 100)}% of ${maxTokens})`
    );
  }

  return true;
}

export function estimatePromptTokens(
  systemPrompt: string,
  contextChunks: string[],
  conversationHistory: Array<{ role: string; content: string }>,
  userQuery: string
): number {
  const systemTokens = estimateTokens(systemPrompt);
  const contextTokens = contextChunks.reduce((sum, chunk) => sum + estimateTokens(chunk), 0);
  const historyTokens = conversationHistory.reduce(
    (sum, msg) => sum + estimateTokens(msg.content),
    0
  );
  const queryTokens = estimateTokens(userQuery);

  const total = systemTokens + contextTokens + historyTokens + queryTokens;

  console.log(
    `[Token Estimator] Prompt breakdown: system=${systemTokens}, context=${contextTokens}, ` +
      `history=${historyTokens}, query=${queryTokens}, total=${total}`
  );

  return total;
}
