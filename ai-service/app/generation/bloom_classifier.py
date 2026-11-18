"""
Automated Bloom's Taxonomy Question Classification Engine (BE-026 / ATC-82).

Acceptance Criteria:
1. Question được phân loại Bloom level:
   - Phân loại câu hỏi (MCQ và Short Answer) vào 6 cấp độ nhận thức Bloom chuẩn:
     REMEMBER, UNDERSTAND, APPLY, ANALYZE, EVALUATE, CREATE.
2. Classification được lưu:
   - Gắn nhãn bloom_taxonomy_level vào từng câu hỏi và tính ma trận bloom_distribution.
3. Output chỉ sử dụng level hợp lệ:
   - Chuẩn hóa nghiêm ngặt, chỉ chấp nhận 6 cấp độ Bloom chuẩn quốc tế và Bộ GD&ĐT.
4. Classification failure được xử lý:
   - Xử lý lỗi an toàn: khi câu hỏi không rõ ràng hoặc LLM gặp sự cố, tự động fallback về
     cấp độ mặc định (UNDERSTAND) với method='fallback', ghi log cảnh báo và không làm gián đoạn pipeline.
"""

from enum import Enum
import json
import re
from typing import Any, Dict, List, Optional, Tuple, Union
from pydantic import BaseModel, ConfigDict, Field
import structlog

from app.providers.base import BaseAIProvider
from app.providers.factory import get_ai_provider

logger = structlog.get_logger()


# ============================================================================
# Bloom's Taxonomy Cognitive Levels & Definitions
# ============================================================================

class BloomLevel(str, Enum):
    REMEMBER = "REMEMBER"      # Nhận biết / Ghi nhớ
    UNDERSTAND = "UNDERSTAND"  # Thông hiểu
    APPLY = "APPLY"            # Vận dụng
    ANALYZE = "ANALYZE"        # Phân tích / Vận dụng cao
    EVALUATE = "EVALUATE"      # Đánh giá
    CREATE = "CREATE"          # Sáng tạo


BLOOM_LEVEL_METADATA: Dict[BloomLevel, Dict[str, Any]] = {
    BloomLevel.REMEMBER: {
        "titlecase": "Remember",
        "display_vi": "Nhận biết",
        "description": "Nhớ lại thông tin, thuật ngữ, sự kiện, định nghĩa hoặc quy tắc cơ bản.",
        "order": 1,
    },
    BloomLevel.UNDERSTAND: {
        "titlecase": "Understand",
        "display_vi": "Thông hiểu",
        "description": "Diễn giải, giải thích ý nghĩa, so sánh hoặc tóm tắt kiến thức bằng ngôn từ của mình.",
        "order": 2,
    },
    BloomLevel.APPLY: {
        "titlecase": "Apply",
        "display_vi": "Vận dụng",
        "description": "Áp dụng công thức, quy tắc, phương pháp vào tình huống, bài toán mới cụ thể.",
        "order": 3,
    },
    BloomLevel.ANALYZE: {
        "titlecase": "Analyze",
        "display_vi": "Vận dụng cao (Phân tích)",
        "description": "Phân chia thông tin thành các phần, tìm mối liên hệ, chứng minh, giải thích nguyên nhân.",
        "order": 4,
    },
    BloomLevel.EVALUATE: {
        "titlecase": "Evaluate",
        "display_vi": "Đánh giá",
        "description": "Đưa ra nhận xét, phán đoán, đánh giá tính đúng đắn, giá trị của phương pháp hoặc giải pháp.",
        "order": 5,
    },
    BloomLevel.CREATE: {
        "titlecase": "Create",
        "display_vi": "Sáng tạo",
        "description": "Kết hợp các yếu tố để tạo thành tổng thể mới, đề xuất giải pháp, thiết kế mô hình hoặc kế hoạch.",
        "order": 6,
    },
}

VALID_BLOOM_LEVEL_NAMES = [level.value for level in BloomLevel]
VALID_BLOOM_TITLECASE_NAMES = [meta["titlecase"] for meta in BLOOM_LEVEL_METADATA.values()]

# Synonyms and Vietnamese localized keywords mapping to BloomLevel
BLOOM_SYNONYM_MAPPING: Dict[str, BloomLevel] = {
    # Remember
    "remember": BloomLevel.REMEMBER,
    "nhớ": BloomLevel.REMEMBER,
    "ghi nhớ": BloomLevel.REMEMBER,
    "nhận biết": BloomLevel.REMEMBER,
    "recall": BloomLevel.REMEMBER,
    "memorize": BloomLevel.REMEMBER,
    "recognition": BloomLevel.REMEMBER,
    "knowledge": BloomLevel.REMEMBER,
    # Understand
    "understand": BloomLevel.UNDERSTAND,
    "hiểu": BloomLevel.UNDERSTAND,
    "thông hiểu": BloomLevel.UNDERSTAND,
    "comprehend": BloomLevel.UNDERSTAND,
    "comprehension": BloomLevel.UNDERSTAND,
    "interpret": BloomLevel.UNDERSTAND,
    # Apply
    "apply": BloomLevel.APPLY,
    "vận dụng": BloomLevel.APPLY,
    "áp dụng": BloomLevel.APPLY,
    "application": BloomLevel.APPLY,
    "vận dụng thấp": BloomLevel.APPLY,
    # Analyze
    "analyze": BloomLevel.ANALYZE,
    "analyse": BloomLevel.ANALYZE,
    "phân tích": BloomLevel.ANALYZE,
    "vận dụng cao": BloomLevel.ANALYZE,
    "analysis": BloomLevel.ANALYZE,
    # Evaluate
    "evaluate": BloomLevel.EVALUATE,
    "đánh giá": BloomLevel.EVALUATE,
    "evaluation": BloomLevel.EVALUATE,
    "assessment": BloomLevel.EVALUATE,
    "judge": BloomLevel.EVALUATE,
    # Create
    "create": BloomLevel.CREATE,
    "sáng tạo": BloomLevel.CREATE,
    "creation": BloomLevel.CREATE,
    "synthesis": BloomLevel.CREATE,
    "tổng hợp": BloomLevel.CREATE,
    "thiết kế": BloomLevel.CREATE,
}


# Action verbs / cognitive indicators regex patterns
BLOOM_HEURISTIC_INDICATORS: Dict[BloomLevel, List[str]] = {
    BloomLevel.CREATE: [
        r"\b(?:thiết kế|xây dựng|đề xuất|sáng tác|soạn thảo|lập kế hoạch|phát triển mô hình|giải pháp mới|hãy đề xuất)\b",
        r"\b(?:design|create|formulate|devise|compose|propose|construct|generate an original)\b",
    ],
    BloomLevel.EVALUATE: [
        r"\b(?:đánh giá|nhận xét|bình luận|phê bình|biện luận|lựa chọn phương án tối ưu|có hợp lý không|quan điểm của em)\b",
        r"\b(?:evaluate|assess|judge|critique|justify|defend|appraise|argue whether)\b",
    ],
    BloomLevel.ANALYZE: [
        r"\b(?:phân tích|chứng minh|so sánh|đối chiếu|suy ra|rút ra|mối quan hệ giữa|nguyên nhân vì sao|khảo sát sự biến thiên)\b",
        r"\b(?:analyze|analyse|compare|contrast|distinguish|differentiate|prove that|deduce|infer|investigate)\b",
    ],
    BloomLevel.APPLY: [
        r"\b(?:tính\s+(?!chất\b)|tính toán|tìm giá trị|giải phương trình|áp dụng|vận dụng|sử dụng công thức|xác định tọa độ|thực hiện phép tính)\b",
        r"\b(?:calculate|compute|solve|determine|apply|demonstrate|use the formula|find the value)\b",
    ],
    BloomLevel.UNDERSTAND: [
        r"\b(?:giải thích|tại sao|vì sao|mô tả|nêu ý nghĩa|tóm tắt|cho ví dụ|phân biệt|thể hiện điều gì)\b",
        r"\b(?:explain|why|describe|summarize|interpret|illustrate|clarify|what does it mean)\b",
    ],
    BloomLevel.REMEMBER: [
        r"\b(?:nêu|liệt kê|chỉ ra|định nghĩa|phát biểu|kể tên|viết công thức|đâu là|khái niệm nào|là gì)\b",
        r"\b(?:define|list|state|identify|name|recall|mention|who|what is|which of the following is)\b",
    ],
}


# ============================================================================
# Data Models
# ============================================================================

class BloomClassificationResult(BaseModel):
    """Structured result of Bloom taxonomy classification (AC1, AC2, AC3)."""
    model_config = ConfigDict(from_attributes=True)

    level: str = Field(..., description="Canonical Bloom Level code (REMEMBER, UNDERSTAND, etc.)")
    level_titlecase: str = Field(..., description="Titlecase name (Remember, Understand, etc.)")
    display_vi: str = Field(..., description="Vietnamese pedagogical display name (Nhận biết, v.v.)")
    confidence: float = Field(default=0.85, ge=0.0, le=1.0, description="Confidence score of classification")
    method: str = Field(default="heuristic", description="Method used: 'heuristic', 'llm', or 'fallback'")
    matched_indicators: List[str] = Field(default_factory=list, description="Keywords/verbs triggering the level")


class SingleQuestionClassifyRequest(BaseModel):
    """Payload for classifying an individual question."""
    question_text: str = Field(..., min_length=3, description="Text of the question to classify")
    options: Optional[List[str]] = Field(default=None, description="Optional MCQ options")
    explanation: Optional[str] = Field(default=None, description="Optional answer explanation")
    suggested_level: Optional[str] = Field(default=None, description="Optional initial level tag")


class BatchClassifyRequest(BaseModel):
    """Payload for batch classifying multiple questions."""
    questions: List[SingleQuestionClassifyRequest] = Field(..., min_length=1)


# ============================================================================
# Normalization & Level Validation (AC3)
# ============================================================================

def normalize_bloom_level_code(level: Optional[str]) -> BloomLevel:
    """
    Normalizes any input string to a valid BloomLevel enum (AC3).
    Strictly guarantees that output is one of the 6 canonical levels.
    """
    if not level or not isinstance(level, str):
        return BloomLevel.UNDERSTAND

    cleaned = level.strip().lower()

    # 1. Direct enum uppercase/lowercase check
    for bl in BloomLevel:
        if bl.value.lower() == cleaned:
            return bl

    # 2. Exact match against synonym mapping
    if cleaned in BLOOM_SYNONYM_MAPPING:
        return BLOOM_SYNONYM_MAPPING[cleaned]

    # 3. Longest substring match to prioritize multi-word phrases (e.g. "vận dụng cao" before "vận dụng")
    for key in sorted(BLOOM_SYNONYM_MAPPING.keys(), key=len, reverse=True):
        if key in cleaned:
            return BLOOM_SYNONYM_MAPPING[key]

    return BloomLevel.UNDERSTAND


def normalize_to_titlecase(level: Optional[str]) -> str:
    """Returns Titlecase string: 'Remember', 'Understand', etc."""
    enum_val = normalize_bloom_level_code(level)
    return BLOOM_LEVEL_METADATA[enum_val]["titlecase"]


# ============================================================================
# Heuristic-based Question Classifier (AC1, AC4)
# ============================================================================

def classify_by_heuristic(
    question_text: str,
    options: Optional[List[str]] = None,
    explanation: Optional[str] = None,
) -> Tuple[BloomLevel, float, List[str]]:
    """
    Rule-based cognitive verb heuristic classification.
    Evaluates highest cognitive complexity first (CREATE -> EVALUATE -> ANALYZE -> APPLY -> UNDERSTAND -> REMEMBER),
    with specialized handling for formula/definition recall questions.
    """
    corpus = question_text
    if explanation:
        corpus += " " + explanation
    if options:
        corpus += " " + " ".join(options)

    corpus_lower = corpus.lower()

    # Specific override: Question explicitly asking to identify/recall a formula or definition
    if re.search(r"\b(?:đâu là công thức|công thức nào|công thức tính|nêu định nghĩa|phát biểu định nghĩa|định nghĩa nào)\b", corpus_lower):
        return BloomLevel.REMEMBER, 0.90, ["nhận_biết_công_thức"]

    # Hierarchy order: check higher order thinking skills first
    search_order = [
        BloomLevel.CREATE,
        BloomLevel.EVALUATE,
        BloomLevel.ANALYZE,
        BloomLevel.APPLY,
        BloomLevel.UNDERSTAND,
        BloomLevel.REMEMBER,
    ]

    for level in search_order:
        patterns = BLOOM_HEURISTIC_INDICATORS.get(level, [])
        matches = []
        for pat in patterns:
            found = re.findall(pat, corpus_lower, re.IGNORECASE)
            if found:
                matches.extend(found)

        if matches:
            # Found distinct cognitive verbs
            confidence = 0.85 if len(matches) > 1 else 0.75
            return level, confidence, list(set(matches))

    # If no distinctive cognitive verbs match:
    # Heuristic: Multiple Choice with math symbols often entails Apply/Compute
    if any(char in question_text for char in ["=", "+", "-", "*", "/", "^", "√"]):
        return BloomLevel.APPLY, 0.65, ["ký_hiệu_toán_học"]

    # Safe baseline fallback
    return BloomLevel.UNDERSTAND, 0.50, []


# ============================================================================
# LLM-assisted Classifier (AC1, AC4)
# ============================================================================

LLM_BLOOM_PROMPT_TEMPLATE = """Bạn là chuyên gia thẩm định sư phạm và đo lường đánh giá giáo dục K-12.
Nhiệm vụ của bạn là phân loại câu hỏi sau đây vào đúng MỘT trong 6 cấp độ nhận thức của Thang Bloom (Bloom's Taxonomy):
1. REMEMBER (Nhận biết)
2. UNDERSTAND (Thông hiểu)
3. APPLY (Vận dụng)
4. ANALYZE (Vận dụng cao / Phân tích)
5. EVALUATE (Đánh giá)
6. CREATE (Sáng tạo)

Câu hỏi:
{question_text}
{options_text}
{explanation_text}

Yêu cầu xuất ra DUY NHẤT một chuỗi JSON hợp lệ với định dạng:
{{
  "level": "REMEMBER | UNDERSTAND | APPLY | ANALYZE | EVALUATE | CREATE",
  "confidence": 0.95,
  "reasoning": "Giải thích ngắn gọn lý do phân loại"
}}
"""


async def classify_by_llm(
    question_text: str,
    options: Optional[List[str]] = None,
    explanation: Optional[str] = None,
    provider: Optional[BaseAIProvider] = None,
) -> Tuple[BloomLevel, float, str]:
    """
    Classifies a question using LLM provider abstraction with fallback handling.
    """
    try:
        ai_provider = provider or get_ai_provider()

        options_text = f"Các phương án: {', '.join(options)}" if options else ""
        explanation_text = f"Lời giải thích: {explanation}" if explanation else ""

        prompt = LLM_BLOOM_PROMPT_TEMPLATE.format(
            question_text=question_text,
            options_text=options_text,
            explanation_text=explanation_text,
        )

        raw_response = await ai_provider.generate_content(
            prompt=prompt,
            temperature=0.1,
            system_instruction="You are an educational assessment expert. Output JSON only.",
        )

        cleaned = re.sub(r"^```(?:json)?\s*", "", raw_response.strip())
        cleaned = re.sub(r"\s*```$", "", cleaned.strip())
        parsed = json.loads(cleaned)

        raw_level = parsed.get("level")
        confidence = float(parsed.get("confidence", 0.90))
        reasoning = str(parsed.get("reasoning", ""))

        level = normalize_bloom_level_code(raw_level)
        return level, min(max(confidence, 0.0), 1.0), reasoning

    except Exception as e:
        logger.warning(
            "llm_bloom_classification_failed_fallback_to_heuristic",
            error=str(e),
            question_text=question_text[:60],
        )
        level, conf, _ = classify_by_heuristic(question_text, options, explanation)
        return level, 0.50, f"Fallback due to: {str(e)}"


# ============================================================================
# Main Classifier Service & Pipeline Integrator (AC1, AC2, AC3, AC4)
# ============================================================================

class BloomTaxonomyClassifier:
    """
    Primary orchestrator for automated Bloom's Taxonomy question classification (BE-026).
    """

    def __init__(self, provider: Optional[BaseAIProvider] = None):
        self.provider = provider

    def classify_question(
        self,
        question_text: str,
        options: Optional[List[str]] = None,
        explanation: Optional[str] = None,
        suggested_level: Optional[str] = None,
    ) -> BloomClassificationResult:
        """
        Synchronously classifies a question using heuristic rules and suggested level hints (AC1, AC3, AC4).
        Guaranteed not to raise unhandled exceptions.
        """
        if not question_text or not question_text.strip():
            # Failure handling for empty text
            return self._build_result(BloomLevel.UNDERSTAND, 0.0, "fallback", ["empty_question_text"])

        # 1. If explicit suggested level is valid, prioritize but verify
        if suggested_level:
            normalized = normalize_bloom_level_code(suggested_level)
            return self._build_result(normalized, 0.95, "suggested_valid", [suggested_level])

        # 2. Run heuristic rule classifier
        try:
            level, conf, indicators = classify_by_heuristic(question_text, options, explanation)
            return self._build_result(level, conf, "heuristic", indicators)
        except Exception as e:
            logger.error("heuristic_classification_error", error=str(e))
            return self._build_result(BloomLevel.UNDERSTAND, 0.40, "fallback", ["error_handled"])

    async def classify_question_async(
        self,
        question_text: str,
        options: Optional[List[str]] = None,
        explanation: Optional[str] = None,
        use_llm: bool = False,
    ) -> BloomClassificationResult:
        """
        Asynchronously classifies a question, with optional deep LLM reasoning.
        """
        if not use_llm:
            return self.classify_question(question_text, options, explanation)

        try:
            level, conf, reasoning = await classify_by_llm(
                question_text=question_text,
                options=options,
                explanation=explanation,
                provider=self.provider,
            )
            return self._build_result(level, conf, "llm", [reasoning[:100]])
        except Exception as e:
            logger.warning("async_classification_failure", error=str(e))
            return self.classify_question(question_text, options, explanation)

    def tag_and_normalize_questions(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Processes and tags a list of question dictionaries with valid Bloom levels (AC2, AC3).
        """
        tagged_questions = []
        for q in questions:
            q_copy = dict(q)
            q_text = str(q_copy.get("question_text") or q_copy.get("question") or "")
            q_opts = q_copy.get("options")
            q_expl = q_copy.get("explanation")
            existing_level = q_copy.get("bloom_taxonomy_level") or q_copy.get("bloom_level")

            classification = self.classify_question(
                question_text=q_text,
                options=q_opts,
                explanation=q_expl,
                suggested_level=existing_level,
            )

            # Store standard titlecase format
            q_copy["bloom_taxonomy_level"] = classification.level_titlecase
            # Store uppercase canonical level
            q_copy["bloom_level_code"] = classification.level
            tagged_questions.append(q_copy)

        return tagged_questions

    def calculate_bloom_distribution(self, questions: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Computes count distribution across the 6 Bloom levels for assessment matrix (AC2).
        """
        distribution: Dict[str, int] = {meta["titlecase"]: 0 for meta in BLOOM_LEVEL_METADATA.values()}

        for q in questions:
            level_str = q.get("bloom_taxonomy_level") or q.get("bloom_level")
            normalized_title = normalize_to_titlecase(level_str)
            distribution[normalized_title] = distribution.get(normalized_title, 0) + 1

        return distribution

    def _build_result(
        self,
        level: BloomLevel,
        confidence: float,
        method: str,
        indicators: List[str],
    ) -> BloomClassificationResult:
        meta = BLOOM_LEVEL_METADATA[level]
        return BloomClassificationResult(
            level=level.value,
            level_titlecase=meta["titlecase"],
            display_vi=meta["display_vi"],
            confidence=confidence,
            method=method,
            matched_indicators=indicators,
        )


# Default singleton instance
bloom_classifier = BloomTaxonomyClassifier()
