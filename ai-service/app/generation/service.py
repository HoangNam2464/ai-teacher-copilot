from app.retrieval.service import search_similar_chunks
from app.providers.gemini import generate_structured_output
from app.generation.schemas import LessonPlan, Quiz

async def generate_lesson_plan_service(workspace_id: str, subject: str, grade_level: str, topic: str, instructions: str):
    query = f"{subject} {grade_level} {topic} {instructions or ''}"
    chunks = await search_similar_chunks(query, workspace_id, top_k=8)

    context_parts = []
    citations = []
    for c in chunks:
        cid = str(c.id)
        context_parts.append(f"<source id=\"{cid}\">\n{c.content}\n</source>")
        citations.append({
            "chunkId": cid,
            "fileName": "Tài liệu học liệu môn học",
            "excerpt": c.content[:250].strip() + ("..." if len(c.content) > 250 else "")
        })

    context_text = "\n\n".join(context_parts) if context_parts else "Chưa có tài liệu nguồn nào được tải lên."

    prompt = f"""
Bạn là chuyên gia sư phạm hàng đầu tại Việt Nam, chuyên soạn Kế hoạch bài dạy (Giáo án) theo chuẩn Thông tư / Công văn của Bộ GD&ĐT.
Nhiệm vụ: Soạn một kế hoạch bài dạy chi tiết cho:
- Môn học: {subject}
- Khối lớp: {grade_level}
- Chủ đề bài dạy: {topic}
- Yêu cầu sư phạm bổ sung: {instructions or 'Không có'}

QUY TẮC BẮT BUỘC VỀ BẢN QUYỀN HỌC LIỆU (GROUNDING):
1. Bám sát 100% các kiến thức trọng tâm, bài toán mẫu, dạng bài tập và ví dụ thực tế được cung cấp trong phần <sources>...</sources> dưới đây.
2. Tích hợp các hoạt động dạy học phân hóa đối tượng học sinh (mức cơ bản và mức nâng cao) dựa trên bài tập trong tài liệu.
3. KHÔNG tự ý bịa đặt nội dung nằm ngoài chương trình và tài liệu được cung cấp.

<sources>
{context_text}
</sources>
"""

    result = await generate_structured_output(prompt, LessonPlan)
    return result, citations

async def generate_quiz_service(workspace_id: str, subject: str, grade_level: str, topic: str, num_questions: int, instructions: str):
    query = f"{subject} {grade_level} {topic} {instructions or ''}"
    chunks = await search_similar_chunks(query, workspace_id, top_k=8)

    context_parts = []
    citations = []
    for c in chunks:
        cid = str(c.id)
        context_parts.append(f"<source id=\"{cid}\">\n{c.content}\n</source>")
        citations.append({
            "chunkId": cid,
            "fileName": "Tài liệu học liệu môn học",
            "excerpt": c.content[:250].strip() + ("..." if len(c.content) > 250 else "")
        })

    context_text = "\n\n".join(context_parts) if context_parts else "Chưa có tài liệu nguồn nào được tải lên."

    prompt = f"""
Bạn là chuyên gia khảo thí và sư phạm K-12 tại Việt Nam.
Nhiệm vụ: Tạo một đề kiểm tra trắc nghiệm gồm {num_questions} câu hỏi cho:
- Môn học: {subject}
- Khối lớp: {grade_level}
- Chủ đề: {topic}
- Yêu cầu sư phạm bổ sung: {instructions or 'Không có'}

QUY TẮC BẮT BUỘC VỀ BẢN QUYỀN HỌC LIỆU (GROUNDING):
1. TẤT CẢ các câu hỏi, dạng bài toán, số liệu và tình huống PHẢI ĐƯỢC TRÍCH XUẤT VÀ XÂY DỰNG TRỰC TIẾP từ các bài tập trong phần <sources>...</sources> dưới đây.
2. TUYỆT ĐỐI KHÔNG tự ý tạo các bài toán chung chung nằm ngoài tài liệu nếu tài liệu đã có bài tập tương ứng.
3. Đảm bảo phân bổ đều các mức độ tư duy Bloom Taxonomy (Nhận biết - Remember, Thông hiểu - Understand, Vận dụng - Apply, Vận dụng cao - Analyze/Create).
4. Mỗi câu hỏi phải có 4 lựa chọn rõ ràng, chỉ 1 đáp án đúng và phần giải thích chi tiết phương pháp giải.

<sources>
{context_text}
</sources>
"""

    result = await generate_structured_output(prompt, Quiz)
    return result, citations
