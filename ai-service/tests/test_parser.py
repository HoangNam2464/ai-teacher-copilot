import pytest
from app.ingestion.parser import DocumentParser

def test_unsupported_file_format():
    with pytest.raises(ValueError, match="Unsupported file format: txt"):
        DocumentParser.parse(b"Hello world", "document.txt")

def test_missing_extension():
    with pytest.raises(ValueError, match="Unsupported file format: "):
        DocumentParser.parse(b"Hello world", "document_without_extension")
