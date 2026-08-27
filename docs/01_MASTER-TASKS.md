# 01 - MASTER TASKS (Source of Truth)

> **Giữ nguyên 37 Master Tasks, ID, Sprint, Story Point, Status và nội dung gốc.**
> Tài liệu này là gốc để phân rã ra các sub-tasks cho team (DES, FE, BE, OPS, QA).

| Master Task ID | Group ID Gốc | Summary | Sprint | Story Points | Priority | Dependencies | Trạng Thái |
|---|---|---|---|---|---|---|---|
 | **ATC-101** | `ARCH-001` | [ARCH-001] [ATC-101] Standardize Monorepo Layout & Move AI-Service to Root | Sprint 1 - Foundation | 3 | High | None | **DONE** | 
 | **ATC-102** | `OPS-001` | [OPS-001] [ATC-102] Set Up Docker Compose Dev Infrastructure | Sprint 1 - Foundation | 5 | High | None | **DONE** | 
 | **ATC-103** | `DB-001` | [DB-001] [ATC-103] Set Up Flyway Database Migrations & UUID Standardization | Sprint 1 - Foundation | 5 | High | is blocked by ATC-102 | **DONE** | 
 | **ATC-104** | `OPS-002` | [OPS-002] [ATC-104] Implement Multi-Service CI/CD GitHub Actions | Sprint 1 - Foundation | 5 | High | is blocked by ATC-101 | **DONE** | 
 | **ATC-105** | `FE-001` | [FE-001] [ATC-105] Initialize 4-Layer Frontend Architecture & Tokens | Sprint 1 - Foundation | 5 | High | None | **DONE** | 
 | **ATC-106** | `DOC-001` | [DOC-001] [ATC-106] Formalize System Requirements & SRS Documentation | Sprint 1 - Foundation | 3 | Medium | None | **DONE** | 
 | **ATC-201** | `BE-001` | [BE-001] [ATC-201] Teacher Registration & Secure BCrypt Password Hashing | Sprint 2 - Auth & Ingestion | 3 | High | is blocked by ATC-103, ATC-105 | **DONE** | 
 | **ATC-202** | `BE-002` | [BE-002] [ATC-202] Teacher Login & Stateless JWT Token Issuance | Sprint 2 - Auth & Ingestion | 3 | High | is blocked by ATC-201 | **DONE** | 
 | **ATC-203** | `BE-003` | [BE-003] [ATC-203] Spring Security Stateless Filter & Axios Bearer Interceptor | Sprint 2 - Auth & Ingestion | 5 | High | is blocked by ATC-202 | **DONE** | 
 | **ATC-204** | `BE-004` | [BE-004] [ATC-204] Teacher Workspace Management & Data Isolation Gate | Sprint 2 - Auth & Ingestion | 5 | High | is blocked by ATC-203 | **DONE** | 
 | **ATC-205** | `BE-005` | [BE-005] [ATC-205] Document Upload to MinIO & Metadata Tracking | Sprint 2 - Auth & Ingestion | 5 | High | is blocked by ATC-204 | **DONE** | 
 | **ATC-206** | `AI-001` | [AI-001] [ATC-206] Document Parser & Structure-Aware Chunking Pipeline | Sprint 2 - Auth & Ingestion | 5 | High | is blocked by ATC-205 | **DONE** | 
 | **ATC-207** | `AI-002` | [AI-002] [ATC-207] Embedding Generation & pgvector Persistence | Sprint 2 - Auth & Ingestion | 5 | High | is blocked by ATC-206 | **DONE** | 
 | **ATC-208** | `QA-001` | [QA-001] [ATC-208] Unit & Integration Test Suite for Auth & Ingestion | Sprint 2 - Auth & Ingestion | 3 | Medium | is blocked by ATC-203, ATC-207 | **IN PROGRESS** | 
 | **ATC-301** | `AI-003` | [AI-003] [ATC-301] AI Provider Abstraction Factory & Multi-Provider Support | Sprint 3 - RAG & Lesson | 5 | High | is blocked by ATC-207 | **IN PROGRESS** | 
 | **ATC-302** | `AI-004` | [AI-004] [ATC-302] Vector Similarity Retrieval with Workspace Isolation | Sprint 3 - RAG & Lesson | 5 | High | is blocked by ATC-301 | **IN PROGRESS** | 
 | **ATC-303** | `AI-005` | [AI-005] [ATC-303] Implement Prompt Boundary <sources> & Insufficient Evidence | Sprint 3 - RAG & Lesson | 5 | High | is blocked by ATC-302 | **TO DO** | 
 | **ATC-304** | `AI-006` | [AI-006] [ATC-304] AI Lesson Planner Structured Output Generation & Persistence | Sprint 3 - RAG & Lesson | 8 | High | is blocked by ATC-303 | **TO DO** | 
 | **ATC-305** | `BE-006` | [BE-006] [ATC-305] Citation Provenance Resolution & Storage API | Sprint 3 - RAG & Lesson | 3 | High | is blocked by ATC-304 | **TO DO** | 
 | **ATC-306** | `BE-007` | [BE-007] [ATC-306] Teacher Inline Review, Manual Edit & Save API | Sprint 3 - RAG & Lesson | 3 | High | is blocked by ATC-304 | **TO DO** | 
 | **ATC-307** | `BE-008` | [BE-008] [ATC-307] Professional Word (.docx) & PDF Export Engine | Sprint 3 - RAG & Lesson | 5 | High | is blocked by ATC-306 | **TO DO** | 
 | **ATC-401** | `AI-007` | [AI-007] [ATC-401] AI Quiz Generator with Structured Validation & Persistence | Sprint 4 - Quiz & Versioning | 8 | High | is blocked by ATC-303, ATC-304 | **TO DO** | 
 | **ATC-402** | `AI-008` | [AI-008] [ATC-402] Integrated Bloom's Taxonomy Tagging Engine | Sprint 4 - Quiz & Versioning | 3 | High | is blocked by ATC-401 | **TO DO** | 
 | **ATC-403** | `BE-009` | [BE-009] [ATC-403] Instruction-Based Content Regeneration with Versioning | Sprint 4 - Quiz & Versioning | 5 | High | is blocked by ATC-401, ATC-306 | **TO DO** | 
 | **ATC-404** | `BE-010` | [BE-010] [ATC-404] Document History & Version Lineage API | Sprint 4 - Quiz & Versioning | 3 | Medium | is blocked by ATC-403 | **TO DO** | 
 | **ATC-405** | `AI-009` | [AI-009] [ATC-405] Assessment Rubric Generator | Sprint 4 - Quiz & Versioning | 8 | Medium | is blocked by ATC-304, ATC-401 | **TO DO** | 
 | **ATC-406** | `BE-011` | [BE-011] [ATC-406] Export Engine Extension for Quizzes & Answer Keys | Sprint 4 - Quiz & Versioning | 3 | Medium | is blocked by ATC-307, ATC-401 | **TO DO** | 
 | **ATC-501** | `QA-002` | [QA-002] [ATC-501] End-to-End Vertical Slice Integration Test Suite | Sprint 5 - Testing & Optimization | 8 | High | is blocked by ATC-307, ATC-404 | **TO DO** | 
 | **ATC-502** | `AI-010` | [AI-010] [ATC-502] RAG Evaluation Benchmark (20–30 K-12 Test Cases) | Sprint 5 - Testing & Optimization | 8 | High | is blocked by ATC-303, ATC-401 | **TO DO** | 
 | **ATC-503** | `DB-002` | [DB-002] [ATC-503] Retrieval & Embedding Latency Optimization | Sprint 5 - Testing & Optimization | 5 | Medium | is blocked by ATC-302, ATC-502 | **TO DO** | 
 | **ATC-504** | `QA-003` | [QA-003] [ATC-504] Edge Case Hardening & Malformed File Handling | Sprint 5 - Testing & Optimization | 3 | High | is blocked by ATC-206 | **TO DO** | 
 | **ATC-505** | `QA-004` | [QA-004] [ATC-505] Security Audit & Multi-Tenant Data Leak Verification | Sprint 5 - Testing & Optimization | 5 | High | is blocked by ATC-204, ATC-303 | **TO DO** | 
 | **ATC-601** | `OPS-003` | [OPS-003] [ATC-601] Production Multi-Container Docker Compose Setup | Sprint 6 - Production & Handover | 8 | High | is blocked by ATC-501 | **TO DO** | 
 | **ATC-602** | `OPS-004` | [OPS-004] [ATC-602] Nginx Reverse Proxy, CORS & Security Headers | Sprint 6 - Production & Handover | 5 | High | is blocked by ATC-601 | **TO DO** | 
 | **ATC-603** | `OPS-005` | [OPS-005] [ATC-603] Database Backup & Disaster Recovery Automation | Sprint 6 - Production & Handover | 5 | Medium | is blocked by ATC-601 | **TO DO** | 
 | **ATC-604** | `DOC-002` | [DOC-002] [ATC-604] Comprehensive System Documentation & API Cheat-Sheet | Sprint 6 - Production & Handover | 5 | High | is blocked by ATC-501, ATC-502, ATC-503, ATC-504, ATC-505 | **TO DO** | 
 | **ATC-605** | `QA-005` | [QA-005] [ATC-605] Final System Acceptance Testing & Demo Walkthrough | Sprint 6 - Production & Handover | 5 | High | is blocked by ATC-601, ATC-604 | **TO DO** | 
