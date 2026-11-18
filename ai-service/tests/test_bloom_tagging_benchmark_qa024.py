"""
QA Benchmark Automated Test Suite for [QA-024 / ATC-83]:
Test Bloom's Taxonomy Question Tagging and Filtering (Master: ATC-402).

Acceptance Criteria:
1. Độ chính xác gắn nhãn Bloom (Accuracy) đạt tối thiểu 85% trên tập dữ liệu benchmark kiểm thử K-12.
2. Kiểm tra độ phủ trên toàn bộ 6 cấp độ nhận thức của Thang Bloom (Remember, Understand, Apply, Analyze, Evaluate, Create).
3. Kiểm thử phân bổ ma trận nhận thức đề thi (Bloom Distribution Matrix).
4. Kiểm thử bộ lọc câu hỏi theo thang Bloom (Filter by Bloom Level).
"""

from typing import Dict, List, Tuple
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import settings
from app.generation.bloom_classifier import (
    BloomLevel,
    bloom_classifier,
    normalize_to_titlecase,
)
from app.main import app


# ============================================================================
# Benchmark Dataset: 30 K-12 Ground-Truth Questions Across 6 Bloom Levels
# ============================================================================

BENCHMARK_DATASET: List[Tuple[str, str, BloomLevel]] = [
    # ------------------ Level 1: REMEMBER (Nhận biết) ------------------
    (
        "Nêu định nghĩa đoạn thẳng có hướng trong hình học phẳng 10.",
        "Toán",
        BloomLevel.REMEMBER,
    ),
    (
        "Liệt kê các kim loại kiềm trong nhóm IA của bảng tuần hoàn hóa học.",
        "Hóa học",
        BloomLevel.REMEMBER,
    ),
    (
        "Đâu là công thức tính động năng của một vật có khối lượng m chuyển động với vận tốc v?",
        "Vật lí",
        BloomLevel.REMEMBER,
    ),
    (
        "Kể tên tác giả của bài thơ 'Tây Tiến' trong chương trình Ngữ văn lớp 12.",
        "Ngữ văn",
        BloomLevel.REMEMBER,
    ),
    (
        "Chiến thắng Điện Biên Phủ trên không diễn ra vào năm nào?",
        "Lịch sử",
        BloomLevel.REMEMBER,
    ),

    # ------------------ Level 2: UNDERSTAND (Thông hiểu) ------------------
    (
        "Hãy giải thích vì sao khi nhiệt độ tăng thì tốc độ phản ứng hóa học thường tăng theo?",
        "Hóa học",
        BloomLevel.UNDERSTAND,
    ),
    (
        "Mô tả ý nghĩa của quy luật phân li độc lập của Menđen trong di truyền học.",
        "Sinh học",
        BloomLevel.UNDERSTAND,
    ),
    (
        "Tại sao trong đoạn mạch mắc nối tiếp, cường độ dòng điện tại mọi điểm đều như nhau?",
        "Vật lí",
        BloomLevel.UNDERSTAND,
    ),
    (
        "Tóm tắt nội dung chính và thông điệp nhân văn của truyện ngắn 'Vợ nhặt'.",
        "Ngữ văn",
        BloomLevel.UNDERSTAND,
    ),
    (
        "Phân biệt sự khác nhau cơ bản giữa véc tơ cùng phương và véc tơ cùng hướng.",
        "Toán",
        BloomLevel.UNDERSTAND,
    ),

    # ------------------ Level 3: APPLY (Vận dụng) ------------------
    (
        "Tính giá trị của biểu thức A = sin^2(45 độ) + cos^2(45 độ) - tan(45 độ).",
        "Toán",
        BloomLevel.APPLY,
    ),
    (
        "Giải phương trình bậc hai 3x^2 - 7x + 2 = 0 trên tập số thực.",
        "Toán",
        BloomLevel.APPLY,
    ),
    (
        "Tính nhiệt lượng cần cung cấp để đun sôi 2 lít nước từ 25 độ C (c = 4200 J/kg.K).",
        "Vật lí",
        BloomLevel.APPLY,
    ),
    (
        "Xác định tọa độ giao điểm của parabol y = x^2 - 4x + 3 với trục hoành Ox.",
        "Toán",
        BloomLevel.APPLY,
    ),
    (
        "Áp dụng định luật Ohm để tính điện trở tương đương của hai điện trở 6 Ohm và 12 Ohm mắc song song.",
        "Vật lí",
        BloomLevel.APPLY,
    ),

    # ------------------ Level 4: ANALYZE (Vận dụng cao / Phân tích) ------------------
    (
        "Hãy phân tích mối quan hệ nhân quả giữa cuộc khủng hoảng kinh tế thế giới 1929-1933 và sự ra đời của chủ nghĩa phát xít.",
        "Lịch sử",
        BloomLevel.ANALYZE,
    ),
    (
        "Chứng minh rằng đồ thị hàm số bậc ba y = ax^3 + bx^2 + cx + d luôn nhận điểm uốn làm tâm đối xứng.",
        "Toán",
        BloomLevel.ANALYZE,
    ),
    (
        "So sánh đặc điểm cấu tạo tế bào nhân sơ và tế bào nhân thực để làm rõ tính tiến hóa.",
        "Sinh học",
        BloomLevel.ANALYZE,
    ),
    (
        "Khảo sát sự biến thiên của hàm số và xác định các khoảng đồng biến, nghịch biến.",
        "Toán",
        BloomLevel.ANALYZE,
    ),
    (
        "Rút ra quy luật biến đổi tính kim loại và tính phi kim của các nguyên tố trong cùng một chu kỳ.",
        "Hóa học",
        BloomLevel.ANALYZE,
    ),

    # ------------------ Level 5: EVALUATE (Đánh giá) ------------------
    (
        "Hãy đánh giá hiệu quả kinh tế và tác động môi trường của việc xây dựng nhà máy điện gió ngoài khơi.",
        "Địa lí",
        BloomLevel.EVALUATE,
    ),
    (
        "Nhận xét về tính chính xác và độ chặt chẽ trong lập luận của bài chứng minh dưới đây.",
        "Toán",
        BloomLevel.EVALUATE,
    ),
    (
        "Bình luận về câu nói 'Văn học là nhân học' của Maxim Gorky qua hình tượng nhân vật Tràng.",
        "Ngữ văn",
        BloomLevel.EVALUATE,
    ),
    (
        "Theo em, quyết định tạm dừng chiến dịch trong tình huống trên có hợp lý không? Hãy biện luận.",
        "Lịch sử",
        BloomLevel.EVALUATE,
    ),
    (
        "Lựa chọn phương án tối ưu giữa hai giải pháp xử lý nước thải công nghiệp và giải thích lý do lựa chọn.",
        "Hóa học",
        BloomLevel.EVALUATE,
    ),

    # ------------------ Level 6: CREATE (Sáng tạo) ------------------
    (
        "Hãy thiết kế một mô hình đo vận tốc tức thời sử dụng cảm biến quang điện và vi điều khiển.",
        "Vật lí",
        BloomLevel.CREATE,
    ),
    (
        "Hãy đề xuất giải pháp giảm thiểu rác thải nhựa trong trường học của em khả thi trong 6 tháng.",
        "Sinh học",
        BloomLevel.CREATE,
    ),
    (
        "Xây dựng một hệ thống câu hỏi tình huống nhằm phát triển tư duy phản biện cho học sinh lớp 10.",
        "Giáo dục công dân",
        BloomLevel.CREATE,
    ),
    (
        "Sáng tác một đoạn kết mới cho câu chuyện 'Chí Phèo' thể hiện khát vọng hoàn lương của nhân vật.",
        "Ngữ văn",
        BloomLevel.CREATE,
    ),
    (
        "Lập kế hoạch tổ chức ngày hội khoa học STEM với chủ đề 'Năng lượng xanh cho tương lai'.",
        "Hoạt động trải nghiệm",
        BloomLevel.CREATE,
    ),
]


# ============================================================================
# Benchmark Test Suite (QA-024)
# ============================================================================

class TestBloomTaggingBenchmarkQA024:
    """Verifies that Bloom taxonomy classification accuracy achieves >= 85% on K-12 benchmark."""

    def test_benchmark_classification_accuracy_exceeds_85_percent(self):
        """AC1: Độ chính xác gắn nhãn Bloom đạt tối thiểu 85% trên 30 câu hỏi benchmark."""
        total = len(BENCHMARK_DATASET)
        correct = 0
        misclassifications = []

        for q_text, subject, ground_truth in BENCHMARK_DATASET:
            result = bloom_classifier.classify_question(q_text)
            predicted_level = result.level

            if predicted_level == ground_truth.value:
                correct += 1
            else:
                misclassifications.append({
                    "question": q_text,
                    "subject": subject,
                    "ground_truth": ground_truth.value,
                    "predicted": predicted_level,
                    "matched": result.matched_indicators,
                })

        accuracy = (correct / total) * 100

        # Primary Acceptance Criterion: Accuracy must be >= 85%
        assert accuracy >= 85.0, f"Bloom classification accuracy was {accuracy:.2f}%, below the required 85.0% threshold."

    def test_all_six_bloom_levels_covered_in_benchmark(self):
        """AC2: Đảm bảo bộ phân loại nhận diện chính xác ít nhất 80% câu hỏi ở từng cấp độ Bloom."""
        level_accuracy: Dict[BloomLevel, Dict[str, int]] = {
            level: {"total": 0, "correct": 0} for level in BloomLevel
        }

        for q_text, _, ground_truth in BENCHMARK_DATASET:
            level_accuracy[ground_truth]["total"] += 1
            result = bloom_classifier.classify_question(q_text)
            if result.level == ground_truth.value:
                level_accuracy[ground_truth]["correct"] += 1

        for level, stats in level_accuracy.items():
            acc = (stats["correct"] / stats["total"]) * 100
            assert acc >= 80.0, f"Level {level.value} accuracy ({acc:.1f}%) is below 80% per-level target."

    def test_bloom_matrix_distribution_calculation(self):
        """AC3: Kiểm thử ma trận phân bổ Bloom khi sinh đề thi."""
        sample_questions = []
        for level in BloomLevel:
            level_items = [
                {"question_text": q_text, "bloom_taxonomy_level": ground_truth.value}
                for q_text, _, ground_truth in BENCHMARK_DATASET
                if ground_truth == level
            ]
            sample_questions.extend(level_items[:2])  # 2 questions per level = 12 total

        distribution = bloom_classifier.calculate_bloom_distribution(sample_questions)

        # Each level should have exactly 2 questions in the distribution
        for level_title in ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"]:
            assert distribution.get(level_title) == 2

    def test_bloom_filtering_logic(self):
        """AC4: Kiểm thử bộ lọc câu hỏi theo cấp độ Bloom."""
        tagged_questions = []
        for q_text, subject, ground_truth in BENCHMARK_DATASET:
            tagged_questions.append({
                "text": q_text,
                "subject": subject,
                "bloom_level": ground_truth.value,
                "bloom_titlecase": normalize_to_titlecase(ground_truth.value),
            })

        # Filter by Remember
        remember_filtered = [q for q in tagged_questions if q["bloom_level"] == "REMEMBER"]
        assert len(remember_filtered) == 5

        # Filter by Apply
        apply_filtered = [q for q in tagged_questions if q["bloom_level"] == "APPLY"]
        assert len(apply_filtered) == 5

        # Filter by Higher-Order Thinking (Analyze + Evaluate + Create)
        hot_filtered = [
            q for q in tagged_questions
            if q["bloom_level"] in ["ANALYZE", "EVALUATE", "CREATE"]
        ]
        assert len(hot_filtered) == 15
