from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
import time
import os
from pathlib import Path
from utils import process_url_with_markitdown, split_content_into_chunks, GeminiClientWrapper
from markitdown import MarkItDown
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv(override=True)

app = FastAPI(
    title="RAG Parsing API",
    description="API for processing URLs and converting documents to markdown using MarkItDown",
    version="1.0.0",
)

gemini_api_key = os.getenv("GOOGLE_GENAI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    gemini_client = GeminiClientWrapper()
    md = MarkItDown(llm_client=gemini_client, llm_model="gemini-2.5-flash")
else:
    md = MarkItDown()
    print("⚠️ MarkItDown initialized without LLM (no GOOGLE_GENAI_API_KEY found)")


class URLRequest(BaseModel):
    url: HttpUrl

    class Config:
        json_schema_extra = {"example": {"url": "https://example.com/document.pdf"}}


class FilePathRequest(BaseModel):
    file_path: str

    class Config:
        json_schema_extra = {"example": {"file_path": "/path/to/uploads/document.pdf"}}


class ProcessingResponse(BaseModel):
    success: bool
    url: str
    processing_time: float
    content_length: Optional[int] = None
    markdown_content: Optional[str] = None
    error_message: Optional[str] = None
    cached: bool = False
    processing_strategy: Optional[str] = None  # 'batch_pdf' | 'batch_text' | 'rag'
    chunks: Optional[List[Dict[str, Any]]] = (
        None  # List of chunks with content and page numbers
    )

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "url": "https://example.com/document.pdf",
                "processing_time": 2.5,
                "content_length": 15420,
                "markdown_content": "# Document Title\n\nDocument content...",
                "error_message": None,
                "cached": False,
                "processing_strategy": "batch_text",
                "chunks": [
                    {
                        "chunk_content": "# Document Title\n\nFirst chunk content...",
                        "chunk_page_no": 1,
                    },
                    {"chunk_content": "Second chunk content...", "chunk_page_no": 1},
                    {"chunk_content": "Third chunk content...", "chunk_page_no": 2},
                ],
            }
        }


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "RAG Parsing API",
        "description": "Process URLs or local files and convert documents to markdown",
        "endpoints": {
            "POST /process-url": "Process a URL and convert to markdown",
            "POST /process-file": "Process a local file and convert to markdown",
            "GET /health": "Health check endpoint",
            "GET /cache-stats": "View cache statistics",
            "DELETE /cache": "Clear all cached content",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": time.time(), "service": "rag-parsing-api"}


@app.post("/process-url", response_model=ProcessingResponse)
async def process_url_endpoint(request: URLRequest):
    """
    Process a URL and convert the document to markdown.

    - **url**: The URL of the document to process

    Returns the markdown content or processing strategy information:
    - **batch_pdf**: PDF with <200 pages (no markdown generated)
    - **batch_text**: Non-PDF files (Excel, PPTX, etc. - markdown generated)
    - **rag**: PDF with ≥200 pages (markdown generated)

    Files larger than 150MB are rejected.
    ZIP files are not supported.
    """
    url_str = str(request.url)
    start_time = time.time()

    try:
        # Check if content is cached before processing
        from utils import get_cached_content

        cached_content, cached_strategy = get_cached_content(url_str)
        is_cached = cached_strategy is not None  # We have a cached result

        # If content is cached, return it immediately
        if is_cached:
            processing_time = time.time() - start_time

            # Handle cached batch_pdf case
            if cached_strategy == "batch_pdf":
                return ProcessingResponse(
                    success=True,
                    url=url_str,
                    processing_time=processing_time,
                    content_length=0,
                    markdown_content=None,
                    error_message=None,
                    cached=True,
                    processing_strategy=cached_strategy,
                    chunks=None,  # No chunks for batch_pdf
                )
            else:
                # Generate chunks for cached content
                is_pdf = cached_strategy in ["batch_pdf", "rag"]
                chunks = (
                    split_content_into_chunks(cached_content, is_pdf=is_pdf)
                    if cached_content
                    else []
                )
                return ProcessingResponse(
                    success=True,
                    url=url_str,
                    processing_time=processing_time,
                    content_length=len(cached_content) if cached_content else 0,
                    markdown_content=cached_content,
                    error_message=None,
                    cached=True,
                    processing_strategy=cached_strategy,
                    chunks=chunks,
                )

        # Process the URL
        result, processing_strategy = process_url_with_markitdown(url_str)

        processing_time = time.time() - start_time

        # Handle batch_pdf case where result is None but processing succeeded
        if processing_strategy == "batch_pdf":
            return ProcessingResponse(
                success=True,
                url=url_str,
                processing_time=processing_time,
                content_length=0,  # No markdown content generated
                markdown_content=None,  # Explicitly None for batch_pdf
                error_message=None,
                cached=False,  # This is fresh processing, not cached
                processing_strategy=processing_strategy,
                chunks=None,  # No chunks for batch_pdf
            )
        elif result is not None:
            # Generate chunks for the content
            is_pdf = processing_strategy in ["batch_pdf", "rag"]
            chunks = split_content_into_chunks(result, is_pdf=is_pdf)
            return ProcessingResponse(
                success=True,
                url=url_str,
                processing_time=processing_time,
                content_length=len(result),
                markdown_content=result,
                error_message=None,
                cached=False,  # This is fresh processing, not cached
                processing_strategy=processing_strategy,
                chunks=chunks,
            )
        else:
            return ProcessingResponse(
                success=False,
                url=url_str,
                processing_time=processing_time,
                content_length=None,
                markdown_content=None,
                error_message="Failed to process URL. Possible reasons: file too large (>150MB), ZIP file, network error, or unsupported format.",
                cached=False,
                processing_strategy=None,
                chunks=None,
            )

    except Exception as e:
        processing_time = time.time() - start_time

        return ProcessingResponse(
            success=False,
            url=url_str,
            processing_time=processing_time,
            content_length=None,
            markdown_content=None,
            error_message=f"Unexpected error: {str(e)}",
            cached=False,
            processing_strategy=None,
            chunks=None,
        )


@app.post("/process-file", response_model=ProcessingResponse)
async def process_file_endpoint(request: FilePathRequest):
    """
    Process a local file and convert it to markdown.

    - **file_path**: Absolute path to the file on the filesystem

    Returns the markdown content.
    Files larger than 100MB are rejected.
    """
    file_path = request.file_path
    start_time = time.time()

    try:
        # Validate file exists
        if not os.path.exists(file_path):
            return ProcessingResponse(
                success=False,
                url=file_path,
                processing_time=time.time() - start_time,
                content_length=None,
                markdown_content=None,
                error_message=f"File not found: {file_path}",
                cached=False,
                processing_strategy=None,
                chunks=None,
            )

        # Check file size
        file_size = os.path.getsize(file_path)
        MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
        if file_size > MAX_FILE_SIZE:
            return ProcessingResponse(
                success=False,
                url=file_path,
                processing_time=time.time() - start_time,
                content_length=None,
                markdown_content=None,
                error_message=f"File too large: {file_size / (1024*1024):.2f}MB exceeds 100MB limit",
                cached=False,
                processing_strategy=None,
                chunks=None,
            )

        # Process file with MarkItDown
        print(f"🔄 Processing file: {file_path}")
        result = md.convert(file_path)
        markdown_content = result.text_content
        
        processing_time = time.time() - start_time
        content_length = len(markdown_content)

        # Determine if it's a PDF for chunking
        is_pdf = file_path.lower().endswith('.pdf')
        chunks = split_content_into_chunks(markdown_content, is_pdf=is_pdf)

        print(f"✅ Successfully processed: {content_length:,} characters, {len(chunks)} chunks")

        return ProcessingResponse(
            success=True,
            url=file_path,
            processing_time=processing_time,
            content_length=content_length,
            markdown_content=markdown_content,
            error_message=None,
            cached=False,
            processing_strategy="local_file",
            chunks=chunks,
        )

    except Exception as e:
        processing_time = time.time() - start_time
        error_str = str(e)
        print(f"❌ Error processing file: {error_str}")
        
        if "GEMINI_RATE_LIMIT" in error_str:
            error_message = "Google Gemini API RateLimit Hit"
        elif "GEMINI_INTERNAL_ERROR" in error_str:
            error_message = "Google Gemini API Internal Server Error"
        elif "GEMINI_OVERLOADED" in error_str:
            error_message = "Google Gemini API Internal Server Overloaded"
        else:
            error_message = "Processing failed! The server might be overloaded, please try again later."
        
        return ProcessingResponse(
            success=False,
            url=file_path,
            processing_time=processing_time,
            content_length=None,
            markdown_content=None,
            error_message=error_message,
            cached=False,
            processing_strategy=None,
            chunks=None,
        )


@app.get("/cache-stats")
async def get_cache_stats():
    """Get statistics about the cache."""
    from utils import CACHE_DIR

    try:
        cache_files = list(CACHE_DIR.glob("*.json"))
        total_files = len(cache_files)

        total_size = sum(f.stat().st_size for f in cache_files if f.exists())
        total_size_mb = total_size / (1024 * 1024)

        return {
            "cache_directory": str(CACHE_DIR),
            "total_cached_files": total_files,
            "total_cache_size_mb": round(total_size_mb, 2),
            "cache_files": [f.name for f in cache_files],
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error reading cache stats: {str(e)}"
        )


@app.delete("/cache")
async def clear_cache():
    """Clear all cached content."""
    from utils import CACHE_DIR

    try:
        cache_files = list(CACHE_DIR.glob("*.json"))
        deleted_count = 0

        for cache_file in cache_files:
            try:
                cache_file.unlink()
                deleted_count += 1
            except Exception:
                pass

        return {
            "message": f"Cache cleared successfully. Deleted {deleted_count} files.",
            "deleted_files": deleted_count,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing cache: {str(e)}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=3001)
