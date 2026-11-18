"""
Document Parser Implementation with Corrupt File & Empty Text Detection [BE-035].

Handles PDF, DOCX, and TXT parsing with strict verification of file signatures,
structural integrity, and non-empty extractable text requirements.
"""

import io
import zipfile
from pypdf import PdfReader
from pypdf.errors import PdfReadError, EmptyFileError, FileNotDecryptedError, PdfStreamError
import docx
from docx.opc.exceptions import PackageNotFoundError

from app.ingestion.exceptions import (
    CorruptFileError,
    EmptyTextError,
    UnsupportedFileFormatError,
)


class DocumentParser:
    """Parser for extracting structured text from multi-format educational materials."""

    PDF_MAGIC_BYTES = b"%PDF"
    DOCX_MAGIC_BYTES = (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")

    @staticmethod
    def parse_pdf(file_bytes: bytes, allow_empty: bool = True) -> str:
        """
        Parses PDF file bytes and extracts textual content.

        Raises:
            CorruptFileError: If file header is invalid, file is corrupt, or encrypted.
            EmptyTextError: If PDF has no extractable text and allow_empty is False.
        """
        if not file_bytes:
            raise CorruptFileError("Tập tin PDF rỗng (0 bytes).")

        # Validate PDF signature in header
        if DocumentParser.PDF_MAGIC_BYTES not in file_bytes[:1024]:
            raise CorruptFileError("Tập tin PDF bị hỏng hoặc không đúng định dạng (thiếu header %PDF).")

        try:
            reader = PdfReader(io.BytesIO(file_bytes))
        except (PdfReadError, EmptyFileError, PdfStreamError, EOFError, Exception) as e:
            raise CorruptFileError(f"Tập tin PDF bị lỗi cấu trúc dữ liệu: {e}") from e

        if reader.is_encrypted:
            raise CorruptFileError("Tập tin PDF đã bị khóa mã hóa hoặc cài đặt mật khẩu bảo vệ.")

        text_pages = []
        try:
            for page_idx, page in enumerate(reader.pages):
                try:
                    extracted = page.extract_text()
                    if extracted and extracted.strip():
                        text_pages.append(extracted.strip())
                except Exception:
                    continue
        except Exception as e:
            raise CorruptFileError(f"Lỗi khi đọc các trang trong tập tin PDF: {e}") from e

        full_text = "\n\n".join(text_pages).strip()

        if not full_text and not allow_empty:
            raise EmptyTextError(
                "Tài liệu PDF không chứa nội dung văn bản có thể xử lý "
                "(tập tin có thể là bản scan hình ảnh hoặc trang trắng). "
                "Vui lòng tải tài liệu có chứa văn bản."
            )

        return full_text

    @staticmethod
    def parse_docx(file_bytes: bytes, allow_empty: bool = True) -> str:
        """
        Parses DOCX file bytes and extracts text from paragraphs and tables.

        Raises:
            CorruptFileError: If file is not a valid ZIP/DOCX package or XML is corrupted.
            EmptyTextError: If DOCX contains no text and allow_empty is False.
        """
        if not file_bytes:
            raise CorruptFileError("Tập tin DOCX rỗng (0 bytes).")

        # Validate ZIP OpenXML header
        has_valid_magic = any(file_bytes.startswith(magic) for magic in DocumentParser.DOCX_MAGIC_BYTES)
        if not has_valid_magic:
            raise CorruptFileError("Tập tin DOCX bị hỏng hoặc không phải là định dạng nén OpenXML hợp lệ.")

        try:
            doc = docx.Document(io.BytesIO(file_bytes))
        except (PackageNotFoundError, zipfile.BadZipFile, KeyError, Exception) as e:
            raise CorruptFileError(f"Tập tin DOCX bị lỗi cấu trúc tập tin: {e}") from e

        text_blocks = []
        # Extract paragraphs
        for para in doc.paragraphs:
            content = para.text.strip()
            if content:
                text_blocks.append(content)

        # Extract tables
        for table in doc.tables:
            for row in table.rows:
                cells_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if cells_text:
                    text_blocks.append(" | ".join(cells_text))

        full_text = "\n\n".join(text_blocks).strip()

        if not full_text and not allow_empty:
            raise EmptyTextError("Tài liệu DOCX không chứa nội dung văn bản có thể xử lý.")

        return full_text

    @staticmethod
    def parse_txt(file_bytes: bytes, allow_empty: bool = True) -> str:
        """
        Parses plain text file bytes with encoding detection.

        Raises:
            CorruptFileError: If file contains binary executable data.
            EmptyTextError: If text file is empty or whitespace and allow_empty is False.
        """
        if not file_bytes:
            raise CorruptFileError("Tập tin văn bản rỗng (0 bytes).")

        # Check for binary null bytes
        if b"\x00" in file_bytes[:1024]:
            raise CorruptFileError("Tập tin văn bản chứa ký tự nhị phân không hợp lệ.")

        for encoding in ("utf-8", "utf-16", "cp1258", "latin-1"):
            try:
                decoded = file_bytes.decode(encoding)
                if not decoded.strip() and not allow_empty:
                    raise EmptyTextError("Tập tin văn bản không chứa nội dung.")
                return decoded.strip()
            except UnicodeDecodeError:
                continue

        raise CorruptFileError("Không thể giải mã nội dung tập tin văn bản bằng các bảng mã thông dụng.")

    @staticmethod
    def parse(file_bytes: bytes, minio_key: str, allow_empty: bool = True) -> str:
        """
        Unified parser entrypoint routing by file extension with strict validation.

        Args:
            file_bytes: Raw binary content of document.
            minio_key: Object key or file name containing extension.
            allow_empty: When True, suppresses EmptyTextError for dry-run/preview.

        Returns:
            Extracted text content.
        """
        if not file_bytes:
            raise CorruptFileError("Tập tin rỗng (0 bytes), không chứa dữ liệu để xử lý.")

        extension = minio_key.split(".")[-1].lower() if "." in minio_key else ""

        if extension == "pdf":
            return DocumentParser.parse_pdf(file_bytes, allow_empty=allow_empty)
        elif extension in ["docx", "doc"]:
            return DocumentParser.parse_docx(file_bytes, allow_empty=allow_empty)
        elif extension in ["txt", "text", "md", "markdown"]:
            return DocumentParser.parse_txt(file_bytes, allow_empty=allow_empty)
        else:
            raise UnsupportedFileFormatError(extension)
