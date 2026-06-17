from markitdown import MarkItDown
from dotenv import load_dotenv
import time
import os
import hashlib
import json
import requests
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any, List
import PyPDF2
import re
import csv
import zipfile
import xml.etree.ElementTree as ET
from langchain_text_splitters import RecursiveCharacterTextSplitter
import google.generativeai as genai

load_dotenv(override=True)

class GeminiClientWrapper:
    
    def __init__(self, model_name: str = "gemini-2.5-flash"):
        self.model = genai.GenerativeModel(model_name)
        self.chat = self
        self.completions = self
    
    def create(self, messages, model=None, **kwargs):
        try:
            user_message = None
            image_data = None
            
            for msg in messages:
                if msg.get("role") == "user":
                    content = msg.get("content")
                    if isinstance(content, list):
                        for item in content:
                            if item.get("type") == "text":
                                user_message = item.get("text")
                            elif item.get("type") == "image_url":
                                image_url = item.get("image_url", {}).get("url", "")
                                if image_url.startswith("data:"):
                                    import base64
                                    from PIL import Image
                                    import io
                                    
                                    image_b64 = image_url.split(",", 1)[1]
                                    image_bytes = base64.b64decode(image_b64)
                                    image_data = Image.open(io.BytesIO(image_bytes))
                    elif isinstance(content, str):
                        user_message = content
            
            if image_data:
                response = self.model.generate_content([user_message or "Describe this image in detail.", image_data])
            else:
                response = self.model.generate_content(user_message or "Describe this image in detail.")
            
            class Choice:
                def __init__(self, text):
                    self.message = type('obj', (object,), {'content': text})
            
            class Response:
                def __init__(self, text):
                    self.choices = [Choice(text)]
            
            return Response(response.text)
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower() or "rate" in error_str.lower():
                raise Exception(f"GEMINI_RATE_LIMIT: {error_str}")
            elif "500" in error_str or "internal" in error_str.lower():
                raise Exception(f"GEMINI_INTERNAL_ERROR: {error_str}")
            elif "503" in error_str or "overload" in error_str.lower():
                raise Exception(f"GEMINI_OVERLOADED: {error_str}")
            else:
                raise Exception(f"GEMINI_ERROR: {error_str}")

gemini_api_key = os.getenv("GOOGLE_GENAI_API_KEY")
if gemini_api_key:
    genai.configure(api_key=gemini_api_key)
    gemini_client = GeminiClientWrapper()
    md = MarkItDown(llm_client=gemini_client, llm_model="gemini-2.5-flash")
else:
    md = MarkItDown()
    print("⚠️ MarkItDown initialized without LLM (no GOOGLE_GENAI_API_KEY found)")

# Cache directory
CACHE_DIR = Path("url_cache")
CACHE_DIR.mkdir(exist_ok=True)
EXTRACTION_CACHE_DIR = Path("extraction_cache")
EXTRACTION_CACHE_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB in bytes





def inject_page_markers_into_markdown(markdown_content: str, file_path: str, page_count: Optional[int] = None) -> str:
    """
    Inject page markers into PDF markdown content using proportional distribution.
    More efficient approach that doesn't re-extract PDF text.
    """
    if not file_path.lower().endswith('.pdf'):
        print(f"⚠️ Not a PDF file (extension check): {file_path}")
        return markdown_content
    
    if page_count is None:
        page_count = get_pdf_page_count(file_path)
    
    if page_count is None or page_count == 0:
        print(f"⚠️ Could not determine page count for {file_path}")
        return markdown_content
    
    print(f"📄 Injecting page markers for {page_count}-page PDF")
    
    if page_count == 1:
        print(f"ℹ️ Single-page PDF: marking entire document as page 1")
        return f"<!-- Page 1 -->\n{markdown_content}"
    
    content_length = len(markdown_content)
    chars_per_page = content_length / page_count
    
    page_markers = []
    for page_num in range(page_count):
        position = int(page_num * chars_per_page)
        page_markers.append((position, page_num + 1))
        print(f"✓ Page {page_num + 1} marker at position {position} (~{position/content_length*100:.1f}%)")
    
    result = []
    last_pos = 0
    
    for pos, page_num in page_markers:
        result.append(markdown_content[last_pos:pos])
        result.append(f"<!-- Page {page_num} -->\n")
        last_pos = pos
    
    result.append(markdown_content[last_pos:])
    
    final_content = ''.join(result)
    print(f"✅ Injected {len(page_markers)} page markers using proportional distribution")
    return final_content


def get_pdf_page_count(file_path: str) -> Optional[int]:
    """Get the number of pages in a PDF file."""
    try:
        with open(file_path, "rb") as file:
            pdf_reader = PyPDF2.PdfReader(file)
            return len(pdf_reader.pages)
    except Exception as e:
        print(f"Could not determine PDF page count: {e}")
        return None


def get_file_cache_key(file_path: str) -> str:
    stat = os.stat(file_path)
    digest = hashlib.sha256()
    digest.update(str(stat.st_size).encode())
    with open(file_path, "rb") as file:
        for block in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def normalize_segment_text(text: Optional[str]) -> str:
    if not text:
        return ""
    return text.replace("\x00", "").strip()


def make_text_segment(content: str, strategy: str, unit_type: str, unit_index: int, page_number: Optional[int] = None, metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    segment = {
        "type": "text",
        "content": content,
        "strategy": strategy,
        "unitType": unit_type,
        "unitIndex": unit_index,
    }
    if page_number is not None:
        segment["pageNumber"] = page_number
    if metadata:
        segment["metadata"] = metadata
    return segment


def extract_pdf_segments(file_path: str):
    try:
        import fitz

        doc = fitz.open(file_path)
        try:
            for page_index, page in enumerate(doc):
                text = normalize_segment_text(page.get_text("text"))
                if text:
                    yield make_text_segment(text, "pymupdf_pdf", "page", page_index, page_index + 1)
        finally:
            doc.close()
        return
    except Exception as e:
        print(f"PyMuPDF extraction unavailable, falling back to PyPDF2: {e}")

    with open(file_path, "rb") as file:
        reader = PyPDF2.PdfReader(file)
        for page_index, page in enumerate(reader.pages):
            text = normalize_segment_text(page.extract_text())
            if text:
                yield make_text_segment(text, "pypdf2_pdf", "page", page_index, page_index + 1)


def extract_docx_segments(file_path: str):
    namespaces = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with zipfile.ZipFile(file_path) as archive:
        xml_bytes = archive.read("word/document.xml")
    root = ET.fromstring(xml_bytes)
    unit_index = 0
    for paragraph in root.findall(".//w:p", namespaces):
        parts = []
        for node in paragraph.iter():
            if node.tag == f"{{{namespaces['w']}}}t" and node.text:
                parts.append(node.text)
            elif node.tag == f"{{{namespaces['w']}}}tab":
                parts.append("\t")
            elif node.tag == f"{{{namespaces['w']}}}br":
                parts.append("\n")
        text = normalize_segment_text("".join(parts))
        if text:
            yield make_text_segment(text, "docx_xml", "paragraph", unit_index)
            unit_index += 1


def extract_pptx_segments(file_path: str):
    from pptx import Presentation

    presentation = Presentation(file_path)
    for slide_index, slide in enumerate(presentation.slides):
        parts = []
        for shape in slide.shapes:
            if hasattr(shape, "text"):
                text = normalize_segment_text(shape.text)
                if text:
                    parts.append(text)
        content = normalize_segment_text("\n\n".join(parts))
        if content:
            yield make_text_segment(content, "python_pptx", "slide", slide_index, slide_index + 1)


def extract_xlsx_segments(file_path: str):
    from openpyxl import load_workbook

    workbook = load_workbook(file_path, read_only=True, data_only=True)
    try:
        unit_index = 0
        for sheet_index, sheet in enumerate(workbook.worksheets):
            batch = [f"# Sheet {sheet_index + 1}: {sheet.title}"]
            batch_size = 0
            for row in sheet.iter_rows(values_only=True):
                values = ["" if value is None else str(value) for value in row]
                if any(value.strip() for value in values):
                    batch.append("\t".join(values).rstrip())
                    batch_size += 1
                if batch_size >= 200:
                    content = normalize_segment_text("\n".join(batch))
                    if content:
                        yield make_text_segment(content, "openpyxl_xlsx", "sheet_rows", unit_index, sheet_index + 1, {"sheet": sheet.title})
                        unit_index += 1
                    batch = []
                    batch_size = 0
            content = normalize_segment_text("\n".join(batch))
            if content:
                yield make_text_segment(content, "openpyxl_xlsx", "sheet_rows", unit_index, sheet_index + 1, {"sheet": sheet.title})
                unit_index += 1
    finally:
        workbook.close()


def extract_text_segments(file_path: str, strategy: str):
    unit_index = 0
    with open(file_path, "r", encoding="utf-8", errors="replace", newline="") as file:
        while True:
            content = file.read(64 * 1024)
            if not content:
                break
            text = normalize_segment_text(content)
            if text:
                yield make_text_segment(text, strategy, "text_block", unit_index)
                unit_index += 1


def extract_csv_segments(file_path: str):
    unit_index = 0
    with open(file_path, "r", encoding="utf-8", errors="replace", newline="") as file:
        reader = csv.reader(file)
        batch = []
        for row in reader:
            batch.append("\t".join(row))
            if len(batch) >= 500:
                content = normalize_segment_text("\n".join(batch))
                if content:
                    yield make_text_segment(content, "csv_reader", "rows", unit_index)
                    unit_index += 1
                batch = []
        content = normalize_segment_text("\n".join(batch))
        if content:
            yield make_text_segment(content, "csv_reader", "rows", unit_index)


def extract_with_markitdown_segment(file_path: str):
    result = md.convert(file_path)
    markdown_content = result.text_content
    if file_path.lower().endswith(".pdf"):
        page_count = get_pdf_page_count(file_path)
        if page_count and page_count > 0:
            markdown_content = inject_page_markers_into_markdown(markdown_content, file_path, page_count)
    text = normalize_segment_text(markdown_content)
    if text:
        yield make_text_segment(text, "markitdown_fallback", "document", 0)


def extract_file_segments(file_path: str):
    extension = Path(file_path).suffix.lower()
    try:
        if extension == ".pdf":
            yield from extract_pdf_segments(file_path)
        elif extension == ".docx":
            yield from extract_docx_segments(file_path)
        elif extension == ".pptx":
            yield from extract_pptx_segments(file_path)
        elif extension in [".xlsx", ".xlsm"]:
            yield from extract_xlsx_segments(file_path)
        elif extension == ".csv":
            yield from extract_csv_segments(file_path)
        elif extension in [".txt", ".json", ".md"]:
            yield from extract_text_segments(file_path, f"{extension[1:]}_stream")
        else:
            yield from extract_with_markitdown_segment(file_path)
    except Exception as e:
        print(f"Fast extraction failed, falling back to MarkItDown: {e}")
        yield from extract_with_markitdown_segment(file_path)


def stream_cached_or_extract_segments(file_path: str):
    cache_key = get_file_cache_key(file_path)
    cache_file = EXTRACTION_CACHE_DIR / f"{cache_key}.jsonl"

    if cache_file.exists():
        with open(cache_file, "r", encoding="utf-8") as file:
            for line in file:
                line = line.strip()
                if line:
                    event = json.loads(line)
                    if event.get("type") == "meta":
                        event["cached"] = True
                    yield event
        return

    temp_cache_file = cache_file.with_suffix(".jsonl.tmp")
    total_length = 0
    segment_count = 0
    strategy = None

    try:
        with open(temp_cache_file, "w", encoding="utf-8") as cache:
            meta = {
                "type": "meta",
                "cached": False,
                "fileSize": os.path.getsize(file_path),
            }
            cache.write(json.dumps(meta, ensure_ascii=False) + "\n")
            yield meta

            for event in extract_file_segments(file_path):
                if event.get("type") == "text":
                    content = event.get("content") or ""
                    if not content:
                        continue
                    total_length += len(content)
                    segment_count += 1
                    strategy = event.get("strategy") or strategy
                cache.write(json.dumps(event, ensure_ascii=False) + "\n")
                yield event

            if segment_count == 0:
                for event in extract_with_markitdown_segment(file_path):
                    if event.get("type") == "text":
                        content = event.get("content") or ""
                        if not content:
                            continue
                        total_length += len(content)
                        segment_count += 1
                        strategy = event.get("strategy") or strategy
                    cache.write(json.dumps(event, ensure_ascii=False) + "\n")
                    yield event

            if segment_count == 0:
                raise Exception("No text content extracted from file")

            done = {
                "type": "done",
                "success": True,
                "contentLength": total_length,
                "segmentCount": segment_count,
                "strategy": strategy,
            }
            cache.write(json.dumps(done, ensure_ascii=False) + "\n")
            yield done

        os.replace(temp_cache_file, cache_file)
    except Exception:
        if temp_cache_file.exists():
            temp_cache_file.unlink()
        raise


def determine_processing_strategy(url: str, temp_file_path: str, headers: dict) -> str:
    """
    Determine processing strategy based on file type and characteristics.

    Args:
        url: The original URL
        temp_file_path: Path to the downloaded temporary file
        headers: HTTP headers from the request

    Returns:
        'batch_pdf', 'batch_text', or 'rag'
    """
    # Check if it's a PDF file
    content_type = headers.get("content-type", "").lower()
    url_lower = url.lower()

    is_pdf = (
        "pdf" in content_type
        or "application/pdf" in content_type
        or url_lower.endswith(".pdf")
        or ".pdf?" in url_lower
    )

    if is_pdf:
        page_count = get_pdf_page_count(temp_file_path)
        if page_count is not None:
            if page_count < 200:
                print(
                    f"PDF detected: {page_count} pages → batch_pdf processing (no markdown generation)"
                )
                return "batch_pdf"
            else:
                print(
                    f"PDF detected: {page_count} pages → rag processing (with markdown generation)"
                )
                return "rag"
        else:
            print("PDF detected but page count unknown → defaulting to batch_pdf")
            return "batch_pdf"
    else:
        print(
            "Non-PDF file detected → batch_text processing (with markdown generation)"
        )
        return "batch_text"


def get_cache_key(url: str) -> str:
    """Generate a cache key from URL."""
    return hashlib.md5(url.encode()).hexdigest()


def get_cached_content(url: str) -> tuple[Optional[str], Optional[str]]:
    """Check if URL content is already cached and return it with processing strategy."""
    cache_key = get_cache_key(url)
    cache_file = CACHE_DIR / f"{cache_key}.json"

    if cache_file.exists():
        try:
            with open(cache_file, "r", encoding="utf-8") as f:
                cache_data = json.load(f)
                markdown_content = cache_data.get("markdown_content")
                processing_strategy = cache_data.get(
                    "processing_strategy", "batch_text"
                )  # Default fallback

                # For batch_pdf, content is stored as empty string, convert to None
                if processing_strategy == "batch_pdf" and markdown_content == "":
                    markdown_content = None

                return markdown_content, processing_strategy
        except (json.JSONDecodeError, KeyError):
            # If cache file is corrupted, remove it
            cache_file.unlink()

    return None, None


def save_to_cache(url: str, markdown_content: str, processing_strategy: str) -> None:
    """Save markdown content and processing strategy to cache."""
    cache_key = get_cache_key(url)
    cache_file = CACHE_DIR / f"{cache_key}.json"

    cache_data = {
        "url": url,
        "markdown_content": markdown_content,
        "processing_strategy": processing_strategy,
        "cached_at": time.time(),
    }

    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(cache_data, f, indent=2)


def format_file_size(size_bytes: int) -> str:
    """Format file size in human readable format."""
    size = float(size_bytes)
    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024.0:
            return f"{size:.1f} {unit}"
        size /= 1024.0
    return f"{size:.1f} TB"


def get_file_info(url: str) -> tuple[Optional[int], dict]:
    """Get file size and headers from URL using HEAD request."""
    print(f"🔍 Checking file info for: {url}")

    try:
        response = requests.head(url, timeout=30)
        response.raise_for_status()

        headers = dict(response.headers)
        content_length = headers.get("content-length")
        content_type = headers.get("content-type", "unknown")

        print("📋 Response Headers:")
        print(f"   Content-Type: {content_type}")
        print(f"   Content-Length: {content_length}")

        if content_length:
            file_size = int(content_length)
            print(f"📏 File Size: {format_file_size(file_size)}")

            if file_size > MAX_FILE_SIZE:
                print(
                    f"❌ File too large! {format_file_size(file_size)} > {format_file_size(MAX_FILE_SIZE)}"
                )
                return file_size, headers
            else:
                print(
                    f"✅ File size OK: {format_file_size(file_size)} <= {format_file_size(MAX_FILE_SIZE)}"
                )
                return file_size, headers
        else:
            print("⚠️  No Content-Length header found - size unknown")
            return None, headers

    except requests.RequestException as e:
        print(f"❌ Error getting file info: {e}")
        return None, {}


def download_file_direct(url: str) -> Optional[str]:
    """Download file directly for blob URLs where we know the size is OK."""
    print(f"⬇️  Downloading file from: {url}")

    try:
        response = requests.get(url, timeout=60)  # Longer timeout for download
        response.raise_for_status()

        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as temp_file:
            temp_file.write(response.content)
            temp_file.flush()

            file_size = len(response.content)
            print(f"✅ Downloaded successfully: {format_file_size(file_size)}")
            return temp_file.name

    except requests.RequestException as e:
        print(f"❌ Error downloading file: {e}")
        return None


def download_with_size_limit(url: str) -> Optional[str]:
    """Download file from URL with size limit checking (fallback for unknown sizes)."""
    print(f"⬇️  Streaming download with size monitoring for: {url}")

    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()

        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as temp_file:
            downloaded_size = 0

            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    downloaded_size += len(chunk)

                    # Check if we've exceeded the size limit
                    if downloaded_size > MAX_FILE_SIZE:
                        temp_file.close()
                        os.unlink(temp_file.name)
                        print(
                            f"❌ File exceeds 100MB limit during download. Downloaded: {format_file_size(downloaded_size)}"
                        )
                        return None

                    temp_file.write(chunk)

            temp_file.flush()
            print(f"✅ Streamed download complete: {format_file_size(downloaded_size)}")
            return temp_file.name

    except requests.RequestException as e:
        print(f"❌ Error during streaming download: {e}")
        return None


def process_url_with_markitdown(url: str) -> tuple[Optional[str], Optional[str]]:
    """
    Process a URL with MarkItDown, checking cache first and respecting size limits.
    Optimized for blob URLs with HEAD request size checking.

    Args:
        url (str): The URL to process

    Returns:
        tuple[Optional[str], Optional[str]]: (markdown_content, processing_strategy) or (None, None) if processing fails
    """
    print(f"\n🚀 Starting processing for URL: {url}")

    # Check for .zip files and reject them
    if url.lower().endswith(".zip") or ".zip?" in url.lower():
        print("🚫 ZIP files are not supported - returning None")
        return None, None

    # Check cache first
    cached_content, cached_strategy = get_cached_content(url)
    if (
        cached_strategy is not None
    ):  # We have a cached result (content might be None for batch_pdf)
        print("💾 Found cached content - returning immediately")
        return cached_content, cached_strategy

    print("🆕 No cache found - processing new URL")

    # Get file info using HEAD request
    file_size, headers = get_file_info(url)

    # Check content-type for zip files as additional safety
    content_type = headers.get("content-type", "").lower()
    if "zip" in content_type or "application/zip" in content_type:
        print(f"🚫 Detected ZIP file via Content-Type: {content_type} - returning None")
        return None, None

    # If we got a size and it's too large, reject immediately
    if file_size is not None and file_size > MAX_FILE_SIZE:
        print(f"🚫 Rejecting file: {format_file_size(file_size)} exceeds limit")
        return None, None

    # Choose download method based on whether we have size info
    if file_size is not None:
        # We know the size is OK, download directly
        temp_file_path = download_file_direct(url)
    else:
        # Unknown size, use streaming with monitoring
        print("⚠️  File size unknown - using streaming download with monitoring")
        temp_file_path = download_with_size_limit(url)

    if not temp_file_path:
        print("❌ Download failed")
        return None, None

    try:
        # Determine processing strategy
        processing_strategy = determine_processing_strategy(
            url, temp_file_path, headers
        )

        # For batch_pdf, return early without generating markdown
        if processing_strategy == "batch_pdf":
            print("⚡ Early return for batch_pdf - no markdown generation needed")
            # Cache the batch_pdf result (with None content)
            print("💾 Saving batch_pdf result to cache...")
            save_to_cache(url, "", processing_strategy)  # Empty string for batch_pdf
            return None, processing_strategy

        # For rag and batch_text, generate markdown content
        print("🔄 Processing file with MarkItDown...")
        start_time = time.time()
        result = md.convert(temp_file_path)
        processing_time = time.time() - start_time

        markdown_content = result.text_content
        content_length = len(markdown_content)

        # Cache the result
        print("💾 Saving to cache...")
        save_to_cache(url, markdown_content, processing_strategy)

        print(f"✅ Successfully processed in {processing_time:.2f} seconds")
        print(f"📝 Generated markdown content: {content_length:,} characters")
        return markdown_content, processing_strategy

    except Exception as e:
        print(f"❌ Error processing file: {e}")
        return None, None

    finally:
        # Clean up temporary file
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
            print("🧹 Cleaned up temporary file")
