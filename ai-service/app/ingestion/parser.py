import io
from pypdf import PdfReader
import docx

class DocumentParser:
    @staticmethod
    def parse_pdf(file_bytes: bytes) -> str:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text

    @staticmethod
    def parse_docx(file_bytes: bytes) -> str:
        doc = docx.Document(io.BytesIO(file_bytes))
        text = ""
        for para in doc.paragraphs:
            if para.text.strip():
                text += para.text + "\n"
        return text

    @staticmethod
    def parse(file_bytes: bytes, minio_key: str) -> str:
        extension = minio_key.split(".")[-1].lower() if "." in minio_key else ""
        if extension == "pdf":
            return DocumentParser.parse_pdf(file_bytes)
        elif extension in ["docx", "doc"]:
            return DocumentParser.parse_docx(file_bytes)
        else:
            return file_bytes.decode("utf-8", errors="ignore")
