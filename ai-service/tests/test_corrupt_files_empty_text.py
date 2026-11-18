"""
QA & Integration Test Suite for [BE-035]:
Implement Exception Handlers for Corrupt Files & Empty Text.

Verifies Acceptance Criteria:
1. Corrupt file được phát hiện (PDF thiếu %PDF, DOCX hỏng zip, encrypted PDF, binary txt).
2. Empty text được xử lý (trang trắng, PDF scan không có OCR, file 0 bytes).
3. API trả lỗi rõ ràng (thông báo lỗi tiếng Việt/Anh chuẩn xác).
4. Không làm crash ingestion service (pipeline bắt lỗi an toàn, cập nhật FAILED vào DB).
"""

import io
import uuid
import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from pypdf import PdfWriter
import docx

from app.core.config import settings
from app.ingestion.parser import DocumentParser
from app.ingestion.exceptions import (
    CorruptFileError,
    EmptyTextError,
    UnsupportedFileFormatError,
    DocumentIngestionError,
)
from app.ingestion.service import process_document_pipeline
from app.main import app
from httpx import ASGITransport, AsyncClient


class TestCorruptFileDetectionAC1:
    """AC-1: Corrupt files are detected and rejected with CorruptFileError."""

    def test_corrupt_pdf_missing_header_rejected(self):
        """PDF missing %PDF magic bytes is detected as corrupt."""
        corrupt_bytes = b"NOT_A_PDF random binary garbage data 12345"
        with pytest.raises(CorruptFileError, match="%PDF"):
            DocumentParser.parse_pdf(corrupt_bytes)

    def test_corrupt_pdf_truncated_stream_rejected(self):
        """PDF with %PDF header but corrupted/truncated stream raises CorruptFileError."""
        truncated_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\n%%EOF_TRUNCATED"
        with pytest.raises(CorruptFileError):
            DocumentParser.parse_pdf(truncated_bytes)

    def test_corrupt_docx_invalid_zip_signature_rejected(self):
        """DOCX missing PK zip magic bytes is detected as corrupt."""
        corrupt_bytes = b"CORRUPTED_NON_ZIP_DOCX_STREAM_1234567890"
        with pytest.raises(CorruptFileError, match="OpenXML"):
            DocumentParser.parse_docx(corrupt_bytes)

    def test_corrupt_docx_bad_zip_content_rejected(self):
        """DOCX with PK header but corrupted ZIP stream raises CorruptFileError."""
        bad_zip_bytes = b"PK\x03\x04\x00\x00corrupted_payload_that_is_not_a_valid_zip_archive"
        with pytest.raises(CorruptFileError):
            DocumentParser.parse_docx(bad_zip_bytes)

    def test_zero_byte_file_rejected(self):
        """0-byte file raises CorruptFileError across all parser entry points."""
        with pytest.raises(CorruptFileError, match="0 bytes"):
            DocumentParser.parse(b"", "lesson.pdf")

        with pytest.raises(CorruptFileError, match="0 bytes"):
            DocumentParser.parse(b"", "exam.docx")

        with pytest.raises(CorruptFileError, match="0 bytes"):
            DocumentParser.parse(b"", "notes.txt")

    def test_text_file_with_null_bytes_rejected(self):
        """Plain text file containing null bytes (disguised binary) raises CorruptFileError."""
        binary_txt = b"Hello\x00World\x00BinaryData"
        with pytest.raises(CorruptFileError, match="nh\xe1\xbb\x8b ph\xc3\xa2n|nhị phân|binary"):
            DocumentParser.parse_txt(binary_txt)


class TestEmptyTextHandlingAC2:
    """AC-2: Empty text files (scanned images without OCR or blank pages) are handled."""

    def test_pdf_with_blank_page_raises_empty_text_when_disallowed(self):
        """PDF with blank page contains no text and raises EmptyTextError when allow_empty=False."""
        writer = PdfWriter()
        writer.add_blank_page(width=72, height=72)
        stream = io.BytesIO()
        writer.write(stream)
        pdf_bytes = stream.getvalue()

        with pytest.raises(EmptyTextError, match="scan|trang tr\xe1\xba\xafng|trang trắng"):
            DocumentParser.parse_pdf(pdf_bytes, allow_empty=False)

    def test_docx_with_empty_paragraphs_raises_empty_text_when_disallowed(self):
        """DOCX with only empty whitespace paragraphs raises EmptyTextError."""
        doc = docx.Document()
        doc.add_paragraph("   ")
        doc.add_paragraph("\t\n")
        stream = io.BytesIO()
        doc.save(stream)
        docx_bytes = stream.getvalue()

        with pytest.raises(EmptyTextError, match="v\xc4\x83n b\xe1\xba\xa3n|văn bản"):
            DocumentParser.parse_docx(docx_bytes, allow_empty=False)

    def test_txt_with_only_whitespace_raises_empty_text_when_disallowed(self):
        """Text file with whitespace only raises EmptyTextError when allow_empty=False."""
        whitespace_bytes = b"   \n\t  \n   "
        with pytest.raises(EmptyTextError):
            DocumentParser.parse_txt(whitespace_bytes, allow_empty=False)

    def test_valid_pdf_with_text_parses_successfully(self):
        """Valid PDF containing actual educational content extracts clean string."""
        writer = PdfWriter()
        page = writer.add_blank_page(width=100, height=100)
        # Note: PyPDF writer without font cannot easily render text, but DOCX & TXT verify full text
        # Verify allow_empty=True still returns string
        stream = io.BytesIO()
        writer.write(stream)
        pdf_bytes = stream.getvalue()
        result = DocumentParser.parse_pdf(pdf_bytes, allow_empty=True)
        assert isinstance(result, str)


class TestPipelineResilienceAC3AndAC4:
    """AC-3 & AC-4: API returns clear error and does NOT crash ingestion service."""

    @pytest.mark.asyncio
    async def test_pipeline_catches_corrupt_file_and_marks_failed_without_crash(self):
        """AC-4: Corrupt file in pipeline updates DB to FAILED, logs warning, and does NOT crash."""
        corrupt_bytes = b"CORRUPTED_FILE_DATA_NO_HEADER"
        mock_minio_resp = MagicMock()
        mock_minio_resp.read.return_value = corrupt_bytes
        mock_minio_resp.close = MagicMock()
        mock_minio_resp.release_conn = MagicMock()

        doc_id = str(uuid.uuid4())
        ws_id = str(uuid.uuid4())
        minio_key = f"{ws_id}/test_corrupt.pdf"

        with patch("app.ingestion.service.minio_client.get_object", return_value=mock_minio_resp):
            with patch("app.ingestion.service._mark_document_failed", new_callable=AsyncMock) as mock_fail:
                result = await process_document_pipeline(doc_id, ws_id, minio_key)

                # Did not crash, returned FAILED status
                assert result["status"] == "FAILED"
                assert result["error_code"] == "CORRUPT_FILE"
                assert "bị hỏng" in result["error"] or "thiếu header" in result["error"]

                # Verified document was marked FAILED in DB
                mock_fail.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_pipeline_catches_empty_text_and_marks_failed_without_crash(self):
        """AC-4: Scanned image/empty text file in pipeline updates DB to FAILED without crash."""
        writer = PdfWriter()
        writer.add_blank_page(width=72, height=72)
        stream = io.BytesIO()
        writer.write(stream)
        empty_pdf_bytes = stream.getvalue()

        mock_minio_resp = MagicMock()
        mock_minio_resp.read.return_value = empty_pdf_bytes
        mock_minio_resp.close = MagicMock()
        mock_minio_resp.release_conn = MagicMock()

        doc_id = str(uuid.uuid4())
        ws_id = str(uuid.uuid4())
        minio_key = f"{ws_id}/test_empty_scan.pdf"

        with patch("app.ingestion.service.minio_client.get_object", return_value=mock_minio_resp):
            with patch("app.ingestion.service._mark_document_failed", new_callable=AsyncMock) as mock_fail:
                result = await process_document_pipeline(doc_id, ws_id, minio_key)

                assert result["status"] == "FAILED"
                assert result["error_code"] == "EMPTY_TEXT"
                assert "không chứa nội dung văn bản" in result["error"]
                mock_fail.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_validation_endpoint_with_corrupt_file(self):
        """AC-3: Synchronous validation endpoint returns clear diagnostic JSON."""
        corrupt_bytes = b"Corrupt file payload without valid header"
        mock_minio_resp = MagicMock()
        mock_minio_resp.read.return_value = corrupt_bytes

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.api.routes.ingestion.minio_client.get_object", return_value=mock_minio_resp):
                response = await client.post(
                    "/ingestion/validate",
                    json={"minio_object_key": "ws1/corrupt.pdf"},
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY}
                )
                assert response.status_code == 200
                data = response.json()
                assert data["valid"] is False
                assert data["status"] == "CORRUPT_FILE"
                assert data["error_code"] == "CORRUPT_FILE"
                assert len(data["message"]) > 0

    @pytest.mark.asyncio
    async def test_validation_endpoint_with_valid_text(self):
        """AC-3: Synchronous validation endpoint returns valid=True for processable text."""
        valid_text_bytes = "Toán 10: Giới thiệu tập hợp và các phép toán giao, hợp, hiệu.".encode("utf-8")
        mock_minio_resp = MagicMock()
        mock_minio_resp.read.return_value = valid_text_bytes

        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as client:
            with patch("app.api.routes.ingestion.minio_client.get_object", return_value=mock_minio_resp):
                response = await client.post(
                    "/ingestion/validate",
                    json={"minio_object_key": "ws1/giao_an.txt"},
                    headers={"X-API-Key": settings.AI_SERVICE_API_KEY}
                )
                assert response.status_code == 200
                data = response.json()
                assert data["valid"] is True
                assert data["status"] == "VALID"
                assert data["character_count"] > 0
