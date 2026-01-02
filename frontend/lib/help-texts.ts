export const HELP_TEXTS = {
  BM25_INDEXING: `### BM25 Indexing

BM25 (Best Matching 25) is a ranking function that uses lexical matching to find precise word or phrase matches. It's particularly effective for queries that include unique identifiers or technical terms.

BM25 indexing extracts **keywords** and **term statistics** so the system can perform keyword-based searches.

• Essential for Hybrid Search and RRF
• One-time processing per file`,

  HYBRID_SEARCH: `### Hybrid Search

Combines semantic similarity **(vector search)** and keyword relevance **(BM25)**.

 • Vector search understands meaning
 • BM25 boosts important terms
 • Helps retrieve both precise and context-rich chunks

Suppose a user queries "Error code TS-999" in a technical support database. An embedding model might find content about error codes in general, but could miss the exact "TS-999" match. BM25 looks for this specific text string to identify the relevant documentation.`,

  RRF_SEARCH: `### Reciprocal Rank Fusion

Reciprocal Rank Fusion (RRF) is a simple, powerful scoring method used to combine results from multiple search systems: like BM25 + embeddings + hybrid models - into one ranked list.

RRF says: "If multiple systems rank a document highly, even if their scores differ, boost it heavily."

Instead of using raw scores (which may not be comparable), it uses rank positions only.`,

  QUERY_EXPANSION: `### Query Expansion

Expands short or vague queries with related terms before search.

 • Uses an LLM
 • Response time is increased

Recommended for short or ambiguous queries.`,

  KEYWORD_CACHING: `### Keyword Caching

Stores recent query results to avoid redundant processing.

 • Faster responses for repeated queries
 • Reduces LLM API calls
 `,
} as const;
