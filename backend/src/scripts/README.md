# RAG Parsing API

A FastAPI service that converts documents from URLs to markdown using MarkItDown with intelligent caching and size limits.

## Quick Start

1. **Install dependencies:**

   ```bash
   pip install -e .
   ```

2. **Set up environment:**

   ```bash
   # Create .env file with your Azure OpenAI credentials
   AZURE_OPENAI_ENDPOINT=your_endpoint
   AZURE_OPENAI_API_KEY=your_key
   ```

3. **Start the API:**

   ```bash
   python api.py
   ```

4. **Access the API:**
   - API: <http://localhost:8000>
   - Interactive docs: <http://localhost:8000/docs>
   - Alternative docs: <http://localhost:8000/redoc>

## Usage

### Process a URL

```bash
curl -X POST "http://localhost:8000/process-url" \
     -H "Content-Type: application/json" \
     -d '{"url": "https://your-document-url.pdf"}'
```

### Response

```json
{
  "success": true,
  "url": "https://your-document-url.pdf",
  "processing_time": 2.5,
  "content_length": 15420,
  "markdown_content": "# Document Title\n\nContent...",
  "cached": false
}
```

## API Endpoints

- `POST /process-url` - Convert document to markdown
- `GET /health` - Health check
- `GET /cache-stats` - View cache statistics
- `DELETE /cache` - Clear cache


## File Support

✅ PDF, DOCX, PPTX, XLSX, images  
❌ ZIP files (rejected)  
❌ Files >100MB (rejected)