# 📘 AI TEACHER COPILOT FOR K-12 TEACHERS
## Kiến Trúc Hệ Thống, Thiết Kế Cơ Sở Dữ Liệu & Hướng Dẫn Triển Khai Chi Tiết (Full Blueprint)

Tài liệu này tổng hợp toàn bộ kiến trúc kỹ thuật, thiết kế cơ sở dữ liệu PostgreSQL (pgvector), quy trình RAG Pipeline, bộ System Prompt chuẩn hóa cho Giáo án & Đề thi theo thang đo Bloom (Bloom's Taxonomy), cùng mã nguồn mẫu cho cả 3 tầng: **React (Frontend)**, **Spring Boot (Backend)**, và **FastAPI (AI Service)**.

---

## 📑 MỤC LỤC
1. [Sơ đồ Kiến trúc Tổng thể (System Architecture)](#1-sơ-đồ-kiến-trúc-tổng-thể-system-architecture)
2. [Cấu hình Hạ tầng Docker Compose (PostgreSQL + pgvector + MinIO)](#2-cấu-hình-hạ-tầng-docker-compose-postgresql--pgvector--minio)
3. [Thiết kế Cơ sở Dữ liệu & Bảng Vector (Database Schema & DDL)](#3-thiết-kế-cơ-sở-dữ-liệu--bảng-vector-database-schema--ddl)
4. [AI Service: FastAPI + RAG + Bloom Quiz + Lesson Planner](#4-ai-service-fastapi--rag--bloom-quiz--lesson-planner)
5. [Backend Service: Java Spring Boot Orchestrator](#5-backend-service-java-spring-boot-orchestrator)
6. [Frontend UI: React Teacher Workspace & Citation Viewer](#6-frontend-ui-react-teacher-workspace--citation-viewer)
7. [Bộ System Prompt & Pydantic Output Schemas](#7-bộ-system-prompt--pydantic-output-schemas)
8. [Các Bài Học Thực Tế & Cạm Bẫy Kỹ Thuật (Gotchas)](#8-các-bài-học-thực-tế--cạm-bẫy-kỹ-thuật-gotchas)

---

## 1. Sơ đồ Kiến trúc Tổng thể (System Architecture)

```mermaid
flowchart TD
    subgraph Frontend ["Frontend Layer (React 19 + Vite + Tailwind CSS)"]
        UI_Login["Teacher Authentication"]
        UI_Workspace["Teacher Workspace & Doc Manager"]
        UI_Lesson["Lesson Planner (Split View)"]
        UI_Quiz["Quiz Generator (Bloom Taxonomy)"]
        UI_Export["Word / PDF Exporter"]
    end

    subgraph Backend ["Backend Gateway (Java Spring Boot 3)"]
        Auth_Sec["Spring Security + JWT"]
        Doc_Meta["Document Metadata & Workspace Manager"]
        History_Svc["Document History & Versioning"]
        Minio_Client["MinIO S3 Client"]
        AI_Client["AI Service Feign / RestClient"]
    end

    subgraph AIService ["AI Service Layer (Python FastAPI)"]
        Parser["Doc Ingestion (PDF, Word, OCR Vision, Text)"]
        Chunker["Recursive Character Text Splitter"]
        Embedder["Embedding Service (OpenAI / Gemini)"]
        RAG["Vector Semantic Retrieval & Citation Builder"]
        Planner_AI["Structured Lesson Plan Generator"]
        Quiz_AI["Bloom Taxonomy Quiz Generator"]
    end

    subgraph Storage ["Infrastructure Layer (Docker Compose)"]
        PG[("PostgreSQL 16 + pgvector")]
        MinIO[("MinIO Object Storage")]
        LLM["OpenAI / Gemini API"]
    end

    UI_Workspace -->|REST API + JWT| Backend
    Backend -->|Upload Binary| MinIO
    Backend -->|Metadata & History| PG
    Backend -->|Orchestration Request| AIService
    AIService -->|Fetch File| MinIO
    AIService -->|Vector Cosine Search| PG
    AIService -->|Completions| LLM
    AIService -->|Structured JSON + Citations| Backend
    Backend -->|Final Payload| Frontend
```

---

## 2. Cấu hình Hạ tầng Docker Compose (PostgreSQL + pgvector + MinIO)

Tạo file `docker-compose.yml` tại thư mục gốc của dự án:

```yaml
version: '3.8'

services:
  # 1. PostgreSQL với pgvector extension
  postgres:
    image: pgvector/pgvector:pg16
    container_name: teacher-copilot-postgres
    restart: always
    environment:
      POSTGRES_DB: teacher_copilot_dev
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: Password123!
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d teacher_copilot_dev"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 2. MinIO Object Storage
  minio:
    image: minio/minio:latest
    container_name: teacher-copilot-minio
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin_secret
    ports:
      - "9000:9000" # MinIO API
      - "9001:9001" # MinIO Web Console
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  postgres_data:
  minio_data:
```

---

## 3. Thiết kế Cơ sở Dữ liệu & Bảng Vector (Database Schema & DDL)

File `init.sql` (chạy tự động khi khởi tạo database):

```sql
-- Kích hoạt extension pgvector
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Giáo viên / Người dùng
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    school_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Bảng Workspace cá nhân của giáo viên
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Bảng Tài liệu giảng dạy (Metadata)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    minio_bucket VARCHAR(100) NOT NULL DEFAULT 'teaching-documents',
    minio_object_key VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'pdf', 'docx', 'txt', 'png', 'jpg'
    file_size BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'PROCESSING', -- 'PROCESSING', 'INDEXED', 'FAILED'
    error_message TEXT,
    chunk_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Bảng Chunk tài liệu & Vector Embeddings (Phục vụ RAG)
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT, -- Số trang của tệp gốc (để trích dẫn citation)
    content TEXT NOT NULL,
    embedding vector(1536), -- 1536 chiều cho OpenAI text-embedding-3-small (hoặc 768 nếu dùng Gemini)
    metadata JSONB, -- Lưu thêm { "chapter": "Chương 1", "section": "Bài 2" }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index tìm kiếm Cosine Similarity cực nhanh
CREATE INDEX idx_document_chunks_embedding 
ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Index lọc theo workspace để đảm bảo tính cô lập dữ liệu (Data Isolation)
CREATE INDEX idx_document_chunks_workspace ON document_chunks(workspace_id);

-- 5. Bảng Giáo án (Lesson Plans)
CREATE TABLE lesson_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    duration_minutes INT DEFAULT 45,
    objectives JSONB, -- Danh sách mục tiêu bài học
    content JSONB NOT NULL, -- Cấu trúc các hoạt động dạy học
    citations JSONB, -- Mảng danh sách các trích dẫn nguồn
    version INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Bảng Bài kiểm tra / Đề trắc nghiệm (Quizzes)
CREATE TABLE quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    bloom_distribution JSONB, -- Tỉ lệ câu hỏi theo Bloom: { "REMEMBER": 3, "UNDERSTAND": 4, "APPLY": 3 }
    questions JSONB NOT NULL, -- Chi tiết câu hỏi, đáp án, giải thích, citation
    version INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bảng Lịch sử Phiên bản (Document History & Versioning)
CREATE TABLE document_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'LESSON_PLAN', 'QUIZ'
    entity_id UUID NOT NULL,
    version INT NOT NULL,
    content_snapshot JSONB NOT NULL,
    change_summary VARCHAR(255),
    created_by UUID NOT NULL REFERENCES teachers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 4. AI Service: FastAPI + RAG + Bloom Quiz + Lesson Planner

### Cài đặt thư viện Python (`requirements.txt`):
```text
fastapi>=0.110.0
uvicorn>=0.28.0
pydantic>=2.6.0
psycopg2-binary>=2.9.9
pgvector>=0.2.5
minio>=7.2.5
pypdf>=4.1.0
python-docx>=1.1.0
openai>=1.14.0
google-generativeai>=0.4.0
python-dotenv>=1.0.1
```

### Module Xử lý & RAG Retrieval (`ai-service/app/services/rag_service.py`):
```python
import psycopg2
from psycopg2.extras import RealDictCursor
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:Password123!@localhost:5432/teacher_copilot_dev")

def get_embedding(text: str) -> list[float]:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def retrieve_knowledge_base(workspace_id: str, query: str, top_k: int = 5):
    query_vector = get_embedding(query)
    
    conn = psycopg2.connect(DB_URL)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Tìm kiếm cosine distance <=> có lọc chính xác workspace_id
    search_sql = """
        SELECT c.id, c.content, c.page_number, d.filename,
               1 - (c.embedding <=> %s::vector) AS similarity
        FROM document_chunks c
        JOIN documents d ON c.document_id = d.id
        WHERE c.workspace_id = %s
        ORDER BY c.embedding <=> %s::vector
        LIMIT %s;
    """
    cursor.execute(search_sql, (query_vector, workspace_id, query_vector, top_k))
    rows = cursor.fetchall()
    cursor.close()
    conn.close()

    # Định dạng chuỗi Context và danh sách Citation
    context_blocks = []
    citations = []
    
    for idx, r in enumerate(rows, start=1):
        context_blocks.append(
            f"[[Nguồn {idx} | Tệp: {r['filename']} | Trang: {r['page_number']}]]\n{r['content']}"
        )
        citations.append({
            "citation_id": idx,
            "filename": r["filename"],
            "page_number": r["page_number"],
            "snippet": r["content"][:200] + "..."
        })
        
    return "\n\n".join(context_blocks), citations
```

---

## 5. Cấu trúc Prompt & Pydantic Schema cho Đề thi Bloom & Giáo án

### ① Quiz Generator với Bloom's Taxonomy (`ai-service/app/schemas/quiz.py`):
```python
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class BloomTaxonomyLevel(str, Enum):
    REMEMBER = "REMEMBER"       # Nhận biết
    UNDERSTAND = "UNDERSTAND"   # Thông hiểu
    APPLY = "APPLY"             # Vận dụng
    ANALYZE = "ANALYZE"         # Phân tích
    EVALUATE = "EVALUATE"       # Đánh giá
    CREATE = "CREATE"           # Sáng tạo

class QuizQuestion(BaseModel):
    question_index: int = Field(description="Số thứ tự câu hỏi (1, 2, 3...)")
    bloom_level: BloomTaxonomyLevel = Field(description="Cấp độ tư duy Bloom")
    question_text: str = Field(description="Nội dung câu hỏi rõ ràng, sư phạm")
    options: List[str] = Field(description="Chính xác 4 lựa chọn [A, B, C, D]", min_items=4, max_items=4)
    correct_answer: str = Field(description="Đáp án đúng (ví dụ: 'A' hoặc nội dung lựa chọn đúng)")
    explanation: str = Field(description="Giải thích sư phạm chi tiết vì sao đáp án đúng")
    citation_source: Optional[str] = Field(description="Ghi rõ nguồn: [[Nguồn 1 | Tệp: ... | Trang: ...]]")

class QuizResponse(BaseModel):
    title: str
    topic: str
    grade: str
    questions: List[QuizQuestion]
```

### ② System Prompt chuẩn cho Quiz Generator:
```text
Bạn là Trợ lý Sư phạm AI Cao cấp chuyên hỗ trợ giáo viên K-12 thiết kế đề kiểm tra bám sát chuẩn chương trình GDPT và thang đo nhận thức Bloom (Bloom's Taxonomy).

NHIỆM VỤ:
1. Tạo danh sách câu hỏi trắc nghiệm khách quan dựa CHÍNH XÁC trên ngữ cảnh tài liệu được cung cấp dưới đây.
2. Phân bổ câu hỏi đúng theo các cấp độ Bloom được yêu cầu (Nhận biết, Thông hiểu, Vận dụng, Phân tích).
3. Mỗi câu hỏi BẮT BUỘC có 4 phương án lựa chọn, giải thích sư phạm chi tiết và gắn nhãn trích dẫn [[Nguồn X]].
4. Tuyệt đối KHÔNG tự bịa thông tin ngoài tài liệu. Nếu tài liệu không đủ dữ liệu, hãy chỉ dùng kiến thức chuẩn mực trong khuôn khổ môn học.

NGỮ CẢNH TÀI LIỆU NGUỒN:
{context_documents}
```

---

## 6. Backend Service: Java Spring Boot Orchestrator

### Cấu trúc Controller gọi sang FastAPI Service:

```java
package com.teacher.copilot.controller;

import com.teacher.copilot.dto.LessonPlanRequest;
import com.teacher.copilot.dto.LessonPlanResponse;
import com.teacher.copilot.service.AIServiceClient;
import com.teacher.copilot.service.DocumentHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{workspaceId}/lesson-plans")
@RequiredArgsConstructor
public class LessonPlanController {

    private final AIServiceClient aiServiceClient;
    private final DocumentHistoryService historyService;

    @PostMapping("/generate")
    public ResponseEntity<LessonPlanResponse> generateLessonPlan(
            @PathVariable UUID workspaceId,
            @RequestBody LessonPlanRequest request) {
        
        // 1. Gọi sang Python FastAPI AI Service
        LessonPlanResponse response = aiServiceClient.generateLessonPlan(workspaceId, request);
        
        // 2. Tự động ghi lại lịch sử tạo tài liệu ban đầu (Version 1)
        historyService.saveSnapshot(
            "LESSON_PLAN", 
            response.getId(), 
            1, 
            response.getContent(), 
            "Bản nháp AI ban đầu"
        );
        
        return ResponseEntity.ok(response);
    }
}
```

---

## 7. Frontend UI: React Teacher Workspace & Citation Viewer

### CitationBadge Component:
```tsx
import React from 'react';
import { BookOpen } from 'lucide-react';

interface CitationBadgeProps {
  index: number;
  filename: string;
  pageNumber: number;
  snippet: string;
  onOpenSourceModal: () => void;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({
  index,
  filename,
  pageNumber,
  snippet,
  onOpenSourceModal
}) => {
  return (
    <button
      onClick={onOpenSourceModal}
      className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
      title={`Tài liệu: ${filename} (Trang ${pageNumber})`}
    >
      <BookOpen className="w-3 h-3" />
      <span>Nguồn {index}</span>
    </button>
  );
};
```

---

## 8. Các Bài Học Thực Tế & Cạm Bẫy Kỹ Thuật (Gotchas)

1. **Cô lập dữ liệu Workspace (Tenant Isolation):**
   - Luôn bắt buộc truyền `WHERE workspace_id = :workspaceId` trong mọi câu lệnh tìm kiếm pgvector. Điều này ngăn việc giáo viên lớp này xem trích dẫn tài liệu của giáo viên lớp khác.
2. **Quản lý giới hạn Token & Trích xuất File Word/PDF:**
   - Dùng `pypdf` / `pdfplumber` để giữ số trang `page_number` chính xác.
   - Dùng `python-docx` để đọc cả bảng biểu (Tables) vì giáo án và đề thi thường có dạng bảng.
3. **Structured Output Guarantee:**
   - Không parse Regex bằng tay từ câu trả lời của LLM. Hãy sử dụng cơ chế **Tool Calling** hoặc **Pydantic Output Parser** để đảm bảo response luôn là JSON hợp lệ 100%.
4. **Cơ chế Review / Edit / Regenerate:**
   - Đừng ghi đè trực tiếp kết quả mới lên database. Hãy lưu theo dạng phiên bản (`version: 1, 2, 3...`) trong bảng `document_history` để giáo viên có thể hoàn tác (Undo) lại nội dung ưng ý trước đó.

---

> 💡 **Tài liệu này đã được lưu sẵn trong dự án của bạn để bạn có thể tham chiếu và tái sử dụng bất cứ lúc nào!**
