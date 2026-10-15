from typing import Any, Dict, List, Optional, Type, TypeVar
from pydantic import BaseModel
from app.providers.base import BaseAIProvider

T = TypeVar("T", bound=BaseModel)

class MockAIProvider(BaseAIProvider):
    """
    Mock AI Provider for unit tests, offline development, and CI pipelines.
    Generates deterministic structured outputs conforming to any Pydantic model
    and fixed-dimension mock vector embeddings without external API calls.
    """

    def __init__(self, embedding_dimension: int = 768):
        self.embedding_dimension = embedding_dimension
        self.last_system_prompt: Optional[str] = None
        self.last_user_prompt: Optional[str] = None
        self.last_context_chunks: Optional[List[Dict[str, Any]]] = None

    @property
    def provider_name(self) -> str:
        return "mock"

    async def generate_structured_output(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: Type[T] | Any,
        context_chunks: Optional[List[Dict[str, Any]]] = None,
    ) -> T:
        self.last_system_prompt = system_prompt
        self.last_user_prompt = user_prompt
        self.last_context_chunks = context_chunks

        # If response_schema is a Pydantic model class
        if hasattr(response_schema, "model_fields"):
            mock_data = {}
            for field_name, field_info in response_schema.model_fields.items():
                annotation = field_info.annotation
                origin = getattr(annotation, "__origin__", None)
                if field_name == "questions":
                    mock_data[field_name] = [
                        {
                            "question_number": 1,
                            "type": "MCQ",
                            "question_text": "Định lý Cosin trong tam giác ABC có dạng như thế nào?",
                            "options": [
                                "a^2 = b^2 + c^2 - 2bc*cos(A)",
                                "a^2 = b^2 + c^2 + 2bc*cos(A)",
                                "a^2 = b^2 - c^2 - 2bc*cos(A)",
                                "a^2 = (b + c)^2 - 2bc*cos(A)",
                            ],
                            "correct_answer": "A",
                            "correct_answer_index": 0,
                            "explanation": "Theo định lý Cosin trong tam giác ABC: a^2 = b^2 + c^2 - 2bc*cos(A).",
                            "bloom_taxonomy_level": "Remember",
                            "source_chunk_ids": ["mock-chunk-1"],
                        },
                        {
                            "question_number": 2,
                            "type": "SHORT_ANSWER",
                            "question_text": "Phát biểu hệ quả của định lý Cosin dùng để tính góc A trong tam giác ABC.",
                            "options": None,
                            "correct_answer": "cos(A) = (b^2 + c^2 - a^2) / (2bc)",
                            "correct_answer_index": None,
                            "explanation": "Từ a^2 = b^2 + c^2 - 2bc*cos(A), suy ra cos(A) = (b^2 + c^2 - a^2) / (2bc).",
                            "bloom_taxonomy_level": "Understand",
                            "source_chunk_ids": ["mock-chunk-1"],
                        },
                    ]
                elif field_name == "sections":
                    mock_data[field_name] = [
                        {"title": "Khởi động", "duration_minutes": 5, "content": "Nội dung khởi động mẫu"},
                        {"title": "Hình thành kiến thức", "duration_minutes": 25, "content": "Nội dung kiến thức mẫu"},
                        {"title": "Luyện tập & Vận dụng", "duration_minutes": 15, "content": "Nội dung luyện tập mẫu"},
                    ]
                elif origin is list or origin is List:
                    mock_data[field_name] = ["Mục tiêu mẫu 1", "Mục tiêu mẫu 2"]
                elif annotation is int or annotation is Optional[int]:
                    mock_data[field_name] = 45
                elif annotation is float or annotation is Optional[float]:
                    mock_data[field_name] = 1.0
                elif annotation is bool:
                    mock_data[field_name] = False if field_name == "insufficient_evidence" else True
                elif field_name == "difficulty":
                    mock_data[field_name] = "MEDIUM"
                else:
                    mock_data[field_name] = f"Nội dung mẫu cho {field_name}"

            try:
                return response_schema(**mock_data)
            except Exception:
                return response_schema.model_construct(**mock_data)

        return {"title": "Kế hoạch bài dạy mẫu", "status": "mocked"}

    async def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        result = []
        for text in texts:
            val = round(((len(text) % 100) + 1) / 100.0, 4)
            vector = [val] * self.embedding_dimension
            result.append(vector)
        return result
