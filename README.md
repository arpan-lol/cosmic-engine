<div align="center">
    <img src="frontend/public/logo.png" alt="Final Response with Document Viewer" width="100" />  

  # Cosmic Engine
  
  **A production grade RAG experimentation platform for comparing retrieval, ranking, and generation strategies**

  [![Visit](https://img.shields.io/badge/Visit-live-brightgreen?style=for-the-badge)](https://cosmicengine.arpantaneja.dev/)
  [![Features](https://img.shields.io/badge/features-core-yellow?style=for-the-badge)](#core-capabilities)
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>


Cosmic Engine is an end-to-end RAG xperimentation platform designed as a **knowledge base, testing ground, and debugging lab** for modern RAG systems. 

It enables systematic comparison of retrieval and ranking pipelines - including hybrid search, BM25, HNSW-based vector search, reciprocal rank fusion (RRF), query expansion, and caching under real world constraints.

Cosmic Engine focuses on **retrieval quality, context relevance, and system observability**, providing fine-grained control over each stage of the RAG pipeline.

<!-- ---

## Screenshots

<div align="center">
<img src="screenshots/img5_final.png" alt="Final Response with Document Viewer" width="800" />

### Document Upload & Processing
<img src="screenshots/img1_documents_upload.png" alt="Document Upload" width="800" />

### Chunk Viewer with Citations
<img src="screenshots/img2_chunks.png" alt="Chunk Viewer" width="800" />

### AI-Powered Chat
<img src="screenshots/img3_query.png" alt="Chat Interface" width="800" />

<img src="screenshots/img4_response.png" alt="Chat Interface" width="800" />

*Get answers with inline citations back to your documents*

</div> -->

---

## Why Cosmic Engine?

Modern RAG systems often fail silently due to poor retrieval, weak ranking, or suboptimal context selection. Cosmic Engine was built to make these failure modes **visible, measurable, and configurable**.

The platform is designed for:
- RAG engineers benchmarking retrieval strategies
- ML engineers validating context selection quality
- Backend engineers building production RAG infrastructure

## Core Capabilities
- Multi-format ingestion pipeline with citation-based preprocessing
- Recursive chunking with dynamic overlap tuning
- Hybrid retrieval combining BM25 and HNSW vector search
- Reciprocal Rank Fusion (RRF) with configurable top-k selection
- Query expansion and keyword-level caching
- Per-query retrieval diagnostics and ranking visibility
- Time taken metrics split for each sub task

## Experimentation & Benchmarking
Cosmic Engine is built to support:
- A/B testing of retrieval strategies
- Side-by-side comparison of ranking configurations
- Controlled evaluation of query expansion impact
- Reproducible RAG experiments with consistent parameters


## Quick Start
Cosmic Engine uses [Milvus](https://milvus.io) under the hood.
###### Local Development
1. Clone the repo
2. copy env files 
    `cp backend/.env.example backend/.env && cp frontend/.env.example .frontend/.env`
3. Add an LLM and embedding model secrets to backend's .env .
4. Open three terminals: 
    - Server: `cd backend && npm install && npm run dev`
    - Frontend:`cd frontend && npm install && npm run dev`
    - Ingestion service:
      - `cd backend/src/scripts`
      - create a venv (`python -m venv.venv` and `./.venv/scripts/activate`)
      - `pip install -r requirements.txt`
      - `python api.py`
5. [Run milvus with docker](https://milvus.io/docs/install_standalone-docker-compose.md)
6. Run `sudo docker compose ps -a` to make sure the stack is being served at `19530:19530`. 

## Contributing
PRs are welcome!

<div align="center">
  
  **[Try Cosmic Engine](https://cosmicengine.arpantaneja.dev/)**
  
</div>