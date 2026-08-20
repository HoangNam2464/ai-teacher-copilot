# 02 - SPRINT TASKS BREAKDOWN

> Tài liệu phân rã chi tiết 37 Master Tasks thành 126 Implementation Tasks thuộc 5 nhóm chuẩn: DES, FE, BE, OPS, QA.
> **Baseline:** 37 Master Tasks (181 SP) | 126 Implementation Tasks (DES: 15, FE: 21, BE: 37, OPS: 12, QA: 41).

## SPRINT 1 - FOUNDATION

ATC-101 — Standardize Monorepo Layout & Move AI-Service to Root
├── [BE-001] Standardize Backend Package Structure by Feature
├── [FE-001] Initialize React Vite Frontend Project
├── [OPS-001] Restructure Monorepo Root Layout and Workspace Scripts
└── [QA-001] Test Multi-Service Monorepo Build Isolation

ATC-102 — Set Up Docker Compose Dev Infrastructure
├── [OPS-002] Set Up Local Dev Docker Compose for PostgreSQL and MinIO
└── [QA-002] Test Local Dev Infrastructure Startup and Healthchecks

ATC-103 — Set Up Flyway Database Migrations & UUID Standardization
├── [BE-002] Implement Flyway V1 Database Migration Schema
├── [OPS-003] Configure PostgreSQL pgvector Extension Initialization
└── [QA-003] Test Flyway Migrations on PostgreSQL and H2

ATC-104 — Implement Multi-Service CI/CD GitHub Actions
├── [OPS-004] Configure GitHub Actions CI Workflows for All Services
└── [QA-004] Test CI Workflow Triggers and Branch Protection Gates

ATC-105 — Initialize 4-Layer Frontend Architecture & Tokens
├── [DES-001] Define Figma Design System & Color Tokens
├── [FE-002] Implement 4-Layer Frontend Architecture and CSS Tokens
├── [FE-003] Configure Axios Client and React Router Layout Shells
└── [QA-005] Test Frontend Layout Shells and Token Rendering

ATC-106 — Formalize System Requirements & SRS Documentation
├── [BE-003] Document Backend REST API Contracts and Data Models
├── [FE-004] Document Frontend Component Specs and UI Interactions
├── [OPS-005] Document Infrastructure, Security and Environment Specs
└── [QA-006] Define Master Test Strategy and Quality Acceptance Gates


## SPRINT 2 - AUTH & INGESTION

ATC-201 — Teacher Registration & Secure BCrypt Password Hashing
├── [DES-002] Design Teacher Registration Screen in Figma
├── [FE-005] Implement Teacher Registration Form with Validation
├── [BE-004] Implement Teacher Registration API
└── [QA-007] Test Teacher Registration and Duplicate Email Handling

ATC-202 — Teacher Login & Stateless JWT Token Issuance
├── [DES-003] Design Teacher Login Screen in Figma
├── [FE-006] Implement Teacher Login Form and Token Storage
├── [BE-005] Implement Teacher Login and JWT Issuance API
└── [QA-008] Test Teacher Login and Invalid Credentials Handling

ATC-203 — Spring Security Stateless Filter & Axios Bearer Interceptor
├── [FE-007] Implement Axios JWT Bearer Interceptors and 401 Redirect
├── [BE-006] Implement Spring Security Stateless JWT Filter
└── [QA-009] Test JWT Route Protection and Token Expiration

ATC-204 — Teacher Workspace Management & Data Isolation Gate
├── [DES-004] Design Workspace Dashboard and Creation Modal in Figma
├── [FE-008] Implement Workspace List, Creation Modal and Selector
├── [BE-007] Implement Workspace CRUD API with Ownership Gate
└── [QA-010] Test Workspace Multi-Tenant Data Isolation and 403 Forbidden

ATC-205 — Document Upload to MinIO & Metadata Tracking
├── [DES-005] Design Document Upload Drag-and-Drop and File List in Figma
├── [FE-009] Implement Document Upload Component with Progress Bar
├── [BE-008] Implement Multipart Document Upload API to MinIO
└── [QA-011] Test Document Upload, MinIO Storage and Metadata Persistence

ATC-206 — Document Parser & Structure-Aware Chunking Pipeline
├── [BE-009] Implement PDF and DOCX Document Parsing Pipeline
├── [BE-010] Implement Structure-Aware Text Chunking with Overlap
└── [QA-012] Test Document Parsing Accuracy and Chunk Boundaries

ATC-207 — Embedding Generation & pgvector Persistence
├── [BE-011] Implement Text Chunk Embedding Generation
├── [BE-012] Implement Vector Embedding Persistence in pgvector
└── [QA-013] Test Vector Embedding Generation and pgvector Storage

ATC-208 — Unit & Integration Test Suite for Auth & Ingestion
├── [QA-014] Implement Automated Unit and Integration Tests for Auth and Ingestion
└── [QA-015] Execute Security and Negative Input Tests for Upload and Auth


## SPRINT 3 - RAG & LESSON

ATC-301 — AI Provider Abstraction Factory & Multi-Provider Support
├── [BE-013] Implement AI Provider Abstraction Interface and Factory
├── [BE-014] Implement Gemini and OpenAI LLM Provider Adapters
└── [QA-016] Test AI Provider Dynamic Switching and API Error Fallback

ATC-302 — Vector Similarity Retrieval with Workspace Isolation
├── [BE-015] Implement Vector Similarity Search with Workspace Isolation
└── [QA-017] Test Top-K Vector Retrieval and Workspace Data Isolation

ATC-303 — Implement Prompt Boundary <sources> & Insufficient Evidence
├── [BE-016] Implement Sources Boundary Wrapper for Retrieved Context
├── [BE-017] Implement Insufficient Evidence Detection and Handling
└── [QA-018] Test Prompt Injection Defense and Insufficient Evidence Rejection

ATC-304 — AI Lesson Planner Structured Output Generation & Persistence
├── [DES-006] Design Lesson Planner Input Form and Output View in Figma
├── [FE-010] Implement Lesson Planner Generation Form and Viewer
├── [BE-018] Implement Structured Lesson Plan Generation Pipeline
├── [BE-019] Implement Lesson Plan Persistence in Generated Contents Repository
└── [QA-019] Test Lesson Plan JSON Schema and Source Citation Traceability

ATC-305 — Citation Provenance Resolution & Storage API
├── [DES-007] Design Citation Badges, Tooltips and Source Drawer in Figma
├── [FE-011] Implement Citation Badges and Source Chunk Drawer
├── [BE-020] Implement Citation Resolution and Provenance API
└── [QA-020] Test Citation Provenance Resolution to Document Page and Chunk

ATC-306 — Teacher Inline Review, Manual Edit & Save API
├── [DES-008] Design Lesson Plan Inline Editor and Review Status in Figma
├── [FE-012] Implement Inline Lesson Plan Editor with Auto-Save
├── [BE-021] Implement Lesson Content Update and Review Status API
└── [QA-021] Test Inline Content Editing and Review Status Transitions

ATC-307 — Professional Word (.docx) & PDF Export Engine
├── [DES-009] Design Document Export Modal and Layout Options in Figma
├── [FE-013] Implement Document Export Modal and Download Flow
├── [BE-022] Implement DOCX Lesson Export with Citation Footnotes
├── [BE-023] Implement PDF Lesson Export with Pedagogical Formatting
└── [QA-022] Test DOCX and PDF Lesson Export Formatting and Citations


## SPRINT 4 - QUIZ & VERSIONING

ATC-401 — AI Quiz Generator with Structured Validation & Persistence
├── [DES-010] Design Quiz Generator Form and Preview Interface in Figma
├── [FE-014] Implement Quiz Generator Form and Question List Viewer
├── [BE-024] Implement Structured MCQ and Short Answer Quiz Generation
├── [BE-025] Implement Quiz Content Persistence in Generated Contents Repository
└── [QA-023] Test Quiz Question Completeness, Options and Answer Keys

ATC-402 — Integrated Bloom's Taxonomy Tagging Engine
├── [DES-011] Design Bloom Taxonomy Level Badges and Distribution in Figma
├── [FE-015] Implement Bloom's Taxonomy Filter and Level Badges
├── [BE-026] Implement Automated Bloom's Taxonomy Question Classification
└── [QA-024] Test Bloom's Taxonomy Question Tagging and Filtering

ATC-403 — Instruction-Based Content Regeneration with Versioning
├── [DES-012] Design Regeneration Prompt Modal and Version Diff in Figma
├── [FE-016] Implement Instruction-Based Regeneration Dialog and Version Selector
├── [BE-027] Implement Content Regeneration API with Version Lineage
└── [QA-025] Test Content Regeneration Version Increment and Lineage

ATC-404 — Document History & Version Lineage API
├── [DES-013] Design Generation History Timeline and Version Tree in Figma
├── [FE-017] Implement Generation History List and Version Lineage Tree
├── [BE-028] Implement Generation History and Version Tree API
└── [QA-026] Test Generation History Retrieval and Version Tree Navigation

ATC-405 — Assessment Rubric Generator
├── [DES-014] Design Assessment Rubric Matrix and Criteria Editor in Figma
├── [FE-018] Implement Assessment Rubric Table and Inline Criteria Editor
├── [BE-029] Implement Structured Assessment Rubric Generation Pipeline
└── [QA-027] Test Rubric Scoring Matrix and Curriculum Alignment

ATC-406 — Export Engine Extension for Quizzes & Answer Keys
├── [DES-015] Design Student Exam Sheet and Teacher Answer Key in Figma
├── [FE-019] Implement Student Exam and Teacher Answer Key Export Controls
├── [BE-030] Implement Student Quiz Sheet Export without Answers
├── [BE-031] Implement Teacher Answer Key and Grading Guide Export
└── [QA-028] Test Student Quiz Sheet and Teacher Grading Guide Exports


## SPRINT 5 - TESTING & OPTIMIZATION

ATC-501 — End-to-End Vertical Slice Integration Test Suite
├── [BE-032] Set Up Spring Boot and FastAPI Testcontainers Integration Harness
├── [QA-029] Implement Automated End-to-End User Journey Test Suite
└── [QA-030] Validate Full Vertical Slice from Upload to Word Export

ATC-502 — RAG Evaluation Benchmark (20–30 K-12 Test Cases)
├── [BE-033] Implement RAG Retrieval Quality Metrics Logging
├── [QA-031] Execute RAG Evaluation Benchmark across 20–30 K-12 Test Cases
└── [QA-032] Measure RAG Groundedness and Citation Precision Metrics

ATC-503 — Retrieval & Embedding Latency Optimization
├── [BE-034] Optimize pgvector Query Plans and HNSW Index Performance
├── [OPS-006] Tune PostgreSQL Memory and pgvector Worker Configuration
└── [QA-033] Benchmark Vector Retrieval Latency under Concurrent Load

ATC-504 — Edge Case Hardening & Malformed File Handling
├── [FE-020] Implement Error Boundary and Toast Notifications for Upload Failures
├── [BE-035] Implement Exception Handlers for Corrupt Files and Empty Text
└── [QA-034] Test File Ingestion Edge Cases for Corrupt and Scanned Files

ATC-505 — Security Audit & Multi-Tenant Data Leak Verification
├── [BE-036] Harden Authorization Filters and System Prompt Injection Defense
└── [QA-035] Conduct Penetration Testing on Cross-Workspace Leakage and Injections


## SPRINT 6 - PRODUCTION & HANDOVER

ATC-601 — Production Multi-Container Docker Compose Setup
├── [OPS-007] Configure Multi-Stage Production Dockerfiles for All Services
├── [OPS-008] Set Up Production Docker Compose with Isolated Internal Network
└── [QA-036] Test Production Container Startup and Inter-Service Networking

ATC-602 — Nginx Reverse Proxy, CORS & Security Headers
├── [OPS-009] Configure Nginx Reverse Proxy, SSL and Security Headers
└── [QA-037] Test Nginx API Routing, CORS Policies and Security Headers

ATC-603 — Database Backup & Disaster Recovery Automation
├── [OPS-010] Automate PostgreSQL and MinIO Backups with Scheduled Cron Jobs
├── [OPS-011] Document Disaster Recovery Runbook and Restoration Procedures
└── [QA-038] Test Database Backup Integrity and Disaster Recovery Restoration

ATC-604 — Comprehensive System Documentation & API Cheat-Sheet
├── [BE-037] Document OpenAPI Specifications and Backend Architecture
├── [FE-021] Document Frontend Architecture and State Management
├── [OPS-012] Document DevOps Deployment Guide and Environment Cheat-Sheet
└── [QA-039] Produce Final Quality Assurance Report and Test Summary

ATC-605 — Final System Acceptance Testing & Demo Walkthrough
├── [QA-040] Execute Final System Acceptance Test Plan for 11 MVP Features
└── [QA-041] Conduct End-to-End Product Demonstration Walkthrough
