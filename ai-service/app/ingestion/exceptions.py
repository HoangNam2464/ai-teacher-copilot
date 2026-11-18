"""
Ingestion & Document Parsing Custom Exceptions [BE-035].

Defines specialized exceptions for corrupt files, empty text extraction,
and unsupported formats to guarantee clear error reporting and service resilience.
"""


class DocumentIngestionError(Exception):
    """Base exception for document ingestion errors."""

    def __init__(self, message: str, error_code: str = "INGESTION_ERROR"):
        super().__init__(message)
        self.message = message
        self.error_code = error_code


class CorruptFileError(DocumentIngestionError, ValueError):
    """Raised when an uploaded document has corrupted structure, invalid headers, or cannot be parsed."""

    def __init__(self, message: str = "Tập tin bị hỏng hoặc không đúng định dạng chuẩn."):
        super().__init__(message=message, error_code="CORRUPT_FILE")


class EmptyTextError(DocumentIngestionError, ValueError):
    """Raised when a document contains no extractable text (e.g. scanned image without OCR or blank pages)."""

    def __init__(self, message: str = "Tài liệu không chứa nội dung văn bản có thể xử lý (tập tin có thể là bản scan hình ảnh hoặc trang trắng)."):
        super().__init__(message=message, error_code="EMPTY_TEXT")


class UnsupportedFileFormatError(DocumentIngestionError, ValueError):
    """Raised when a file extension or format is not supported."""

    def __init__(self, extension: str):
        message = f"Unsupported file format: {extension}"
        super().__init__(message=message, error_code="UNSUPPORTED_FORMAT")
