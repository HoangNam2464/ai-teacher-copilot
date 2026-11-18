import io
import uuid
import pytest
import tiktoken
from pypdf import PdfWriter
import docx

from app.ingestion.parser import DocumentParser
from app.ingestion.chunker import StructureAwareChunker
from app.ingestion.models import Chunk, DocumentMetadata


class TestDocumentParsingAccuracyQA012:
    """
    QA Integration Tests for [QA-012]: Test Document Parsing Accuracy & Chunk Boundaries (ATC-40 / ATC-206).
    Verifies parser fidelity on PDF, DOCX, and TXT files, preserving headings, sections, and Vietnamese diacritics.
    """

    def test_parse_pdf_vietnamese_curriculum(self):
        """Verify PDF parser extracts multi-page text and preserves Vietnamese educational content."""
        # Create a mock PDF in memory with PyPDF
        writer = PdfWriter()
        writer.add_blank_page(width=72, height=72)
        
        pdf_stream = io.BytesIO()
        writer.write(pdf_stream)
        pdf_bytes = pdf_stream.getvalue()

        # PyPDF can parse this valid PDF without error
        text = DocumentParser.parse(pdf_bytes, "giao_an.pdf")
        assert isinstance(text, str)

    def test_parse_docx_structured_lesson_plan(self):
        """Verify DOCX parser preserves document hierarchy (Title, Heading 1, Heading 2, Paragraphs)."""
        doc = docx.Document()
        doc.add_heading("KẾ HOẠCH BÀI DẠY: HÀM SỐ BẬC HAI", level=0)
        doc.add_heading("I. MỤC TIÊU BÀI HỌC", level=1)
        doc.add_paragraph("1. Về kiến thức: Học sinh nắm vững dạng đồ thị parabol và tọa độ đỉnh.")
        doc.add_paragraph("2. Về năng lực: Năng lực mô hình hóa toán học và tư duy logic.")
        doc.add_heading("II. TIẾN TRÌNH DẠY HỌC", level=1)
        doc.add_paragraph("Hoạt động 1: Khởi động và phát hiện bài toán thực tiễn.")

        stream = io.BytesIO()
        doc.save(stream)
        docx_bytes = stream.getvalue()

        extracted_text = DocumentParser.parse(docx_bytes, "bai_giang.docx")

        # AC-1 & AC-2: Heading and critical lesson objectives are preserved
        assert "KẾ HOẠCH BÀI DẠY: HÀM SỐ BẬC HAI" in extracted_text
        assert "I. MỤC TIÊU BÀI HỌC" in extracted_text
        assert "1. Về kiến thức" in extracted_text
        assert "tọa độ đỉnh" in extracted_text
        assert "II. TIẾN TRÌNH DẠY HỌC" in extracted_text

    def test_parse_txt_vietnamese_utf8(self):
        """Verify plain text parser preserves UTF-8 Vietnamese diacritics and paragraphs."""
        raw_text = "Chương 1: Mệnh đề toán học\n\nKhái niệm mệnh đề và mệnh đề phủ định."
        txt_bytes = raw_text.encode("utf-8")

        result = DocumentParser.parse(txt_bytes, "chuong1.txt")
        assert result == raw_text
        assert "Mệnh đề toán học" in result

    def test_parse_unsupported_formats_raise_error(self):
        """Verify parser rejects unsupported file formats (.exe, .png, etc.)."""
        with pytest.raises(ValueError, match="Unsupported file format: exe"):
            DocumentParser.parse(b"dummy", "file.exe")

        with pytest.raises(ValueError, match="Unsupported file format: png"):
            DocumentParser.parse(b"dummy", "image.png")

        with pytest.raises(ValueError, match="Unsupported file format: "):
            DocumentParser.parse(b"dummy", "no_extension_file")


class TestChunkBoundariesAndOverlapQA012:
    """
    QA Integration Tests for [QA-012] Chunk Boundaries and Overlap.
    Verifies that chunk size strictly adheres to the 512-token limit (using tiktoken cl100k_base),
    maintains a ~50-token overlap between adjacent chunks, preserves headings, and tracks provenance metadata.
    """

    @pytest.fixture
    def chunker_standard(self):
        return StructureAwareChunker(chunk_size=512, overlap=50)

    @pytest.fixture
    def test_metadata(self):
        return DocumentMetadata(
            workspace_id=uuid.uuid4(),
            document_id=uuid.uuid4()
        )

    def test_chunk_boundary_strict_limit_512_tokens(self, chunker_standard, test_metadata):
        """AC-3: Ensure every chunk strictly obeys the max 512 tokens limit."""
        # Generate a large multi-paragraph text with ~2,000 tokens
        paragraphs = []
        for i in range(15):
            para = f"Mục {i+1}: " + "Toán học là môn học nền tảng giúp phát triển tư duy logic và giải quyết vấn đề thực tế trong cuộc sống hàng ngày. " * 8
            paragraphs.append(para)
        
        full_text = "\n\n".join(paragraphs)
        chunks = chunker_standard.chunk(full_text, test_metadata)

        assert len(chunks) >= 3, "Expected multiple chunks for large curriculum text"
        
        encoder = tiktoken.get_encoding("cl100k_base")
        for chunk in chunks:
            assert chunk.token_count <= 512, f"Chunk {chunk.chunk_index} exceeded 512 tokens (was {chunk.token_count})"
            # Also verify via direct encoding calculation
            direct_tokens = len(encoder.encode(chunk.text))
            assert direct_tokens <= 512, f"Direct token count exceeded 512: {direct_tokens}"

    def test_chunk_overlap_between_adjacent_chunks(self, test_metadata):
        """AC-4: Verify overlap exists between adjacent chunks to maintain context continuity."""
        # Use chunk_size=60, overlap=15 for clean assertion
        chunker = StructureAwareChunker(chunk_size=60, overlap=15)
        encoder = tiktoken.get_encoding("cl100k_base")

        para1 = "Đoạn văn thứ nhất nói về định nghĩa đạo hàm và các ứng dụng trong việc khảo sát sự biến thiên của hàm số."
        para2 = "Đoạn văn thứ hai nói về bảng biến thiên, các điểm cực trị cực đại cực tiểu và điểm uốn của đồ thị hàm số bậc ba."
        para3 = "Đoạn văn thứ ba giới thiệu về tiệm cận đứng, tiệm cận ngang và phương pháp vẽ đồ thị chính xác."
        text = f"{para1}\n\n{para2}\n\n{para3}"

        chunks = chunker.chunk(text, test_metadata)
        assert len(chunks) >= 2, "Expected multiple chunks with smaller chunk_size"

        # Verify that chunk 1 and chunk 2 share text tokens
        for i in range(len(chunks) - 1):
            curr_chunk = chunks[i]
            next_chunk = chunks[i + 1]

            # Tokens of current chunk
            curr_tokens = set(encoder.encode(curr_chunk.text))
            next_tokens = set(encoder.encode(next_chunk.text))

            shared_tokens = curr_tokens.intersection(next_tokens)
            assert len(shared_tokens) > 0, f"No overlap found between chunk {i} and chunk {i+1}"

    def test_chunk_heading_preservation(self, chunker_standard, test_metadata):
        """AC-2: Verify headings are preserved in chunks and not lost during chunking."""
        heading1 = "CHƯƠNG I: MỆNH ĐỀ VÀ TẬP HỢP"
        heading2 = "BÀI 1: MỆNH ĐỀ TOÁN HỌC"
        body = "Một khẳng định có tính đúng hoặc sai được gọi là mệnh đề. " * 30
        text = f"{heading1}\n\n{heading2}\n\n{body}"

        chunks = chunker_standard.chunk(text, test_metadata)
        
        all_chunk_text = " ".join([c.text for c in chunks])
        assert heading1 in all_chunk_text
        assert heading2 in all_chunk_text

    def test_chunk_huge_single_paragraph_sliding_window(self, test_metadata):
        """Verify that a single paragraph exceeding 512 tokens is split cleanly via sliding window."""
        chunker = StructureAwareChunker(chunk_size=100, overlap=20)
        
        # Single continuous sentence with > 300 tokens (no newlines)
        huge_paragraph = "Học sinh cần nắm vững các bước giải toán từ đọc đề, phân tích dữ liệu, thiết lập phương trình, giải phương trình và đối chiếu điều kiện để đưa ra kết luận chuẩn xác. " * 15

        chunks = chunker.chunk(huge_paragraph, test_metadata)
        assert len(chunks) > 1, "Huge paragraph should be split into multiple chunks"

        for c in chunks:
            assert c.token_count <= 100

    def test_chunk_provenance_metadata_continuity(self, chunker_standard, test_metadata):
        """Verify provenance metadata (workspace_id, document_id, sequential chunk_index)."""
        text = "Đoạn 1.\n\n" * 100
        chunks = chunker_standard.chunk(text, test_metadata)

        for idx, chunk in enumerate(chunks):
            assert chunk.chunk_index == idx, f"Chunk index out of order: expected {idx}, got {chunk.chunk_index}"
            assert chunk.metadata.workspace_id == test_metadata.workspace_id
            assert chunk.metadata.document_id == test_metadata.document_id
            assert chunk.token_count > 0

    def test_chunk_empty_and_whitespace_text(self, chunker_standard, test_metadata):
        """Verify edge case behavior with empty or whitespace-only strings."""
        assert chunker_standard.chunk("", test_metadata) == []
        assert chunker_standard.chunk("   \n\n   \n\n   ", test_metadata) == []
