# AI_TEACHER_COPILOT_ENGINEERING_KNOWLEDGE

This document is the curated engineering knowledge base for the **AI Teacher Copilot for K-12 Teachers** project.
Captures reusable architectural patterns, templates, and lessons learned for the Spring Boot 3 + FastAPI + React 18 + pgvector stack.

## 1. Executive Summary

AI Teacher Copilot is a Spring Boot + FastAPI + React application built around AI-assisted learning features: knowledge-base RAG, AI chat, multi-agent problem solving, research synthesis, flashcard generation, and document ingestion. The highest-value engineering patterns are not the product features themselves; they are the reusable abstractions underneath them:

- Unified AI gateway with provider fallback and retry logic
- Structured generation with explicit JSON contracts
- Prompt composition using system + task + context + output schema
- RAG ingestion with chunking, embedding, vector retrieval, and citation injection
- Multi-agent orchestration with analysis, solving, and verification stages
- User-scoped security using JWT + per-resource access checks
- Streaming AI responses over SSE for UX and progressive rendering
- Background job processing for heavy document indexing
- Centralized API contracts and frontend service wrappers

The most transferable lessons are architectural, not feature-specific: AI outputs are untrusted data, context must be constrained by scope and provenance, and every AI workflow should normalize outputs before persistence or UI rendering.

## 2. Repository Architecture Map

### Backend architecture

File: `backend/src/app.module.ts`
Class: `AppModule`

The backend is organized as a modular Spring Boot application. It creates global infrastructure first (database, Redis, pgvector, ClickHouse, queue, storage, AI gateway), then registers feature modules such as `chat`, `knowledge-base`, `problem-solver`, `research`, `teach-back`, `quiz`, and `exam-clone`.

Important pattern:
- Infrastructure is global and explicit in the root module.
- Security is kept global with `APP_GUARD` for JWT, roles, throttling, and lifecycle interceptors.
- Domains are separated by feature modules rather than by shared service spaghetti.

### Frontend architecture

File: `frontend/src/config/api.ts`

The frontend centralizes API routes in `ENDPOINTS` and uses a small service layer to wrap HTTP calls. This creates a clean separation between UI feature pages and backend contracts.

### AI stack

Key backend files:
- `backend/src/modules/ai/ai.service.ts` — centralized AI client + model selection + retry + streaming
- `backend/src/modules/ai/embedding.service.ts` — embedding generation
- `backend/src/modules/knowledge-base/knowledge-base.service.ts` — RAG ingestion + search + filtering
- `backend/src/modules/problem-solver/agents/base.agent.ts` — generic agent execution
- `backend/src/modules/research/research.service.ts` — plan + synthesize + citations

### Security stack

Key files:
- `backend/src/common/guards/jwt-auth.guard.ts`
- `backend/src/common/guards/roles.guard.ts`
- `backend/src/common/guards/plan.guard.ts`
- `backend/src/modules/auth/strategies/jwt.strategy.ts`

### RAG stack

Key files:
- `backend/src/modules/knowledge-base/document-processor.service.ts`
- `backend/src/modules/knowledge-base/chunking.service.ts`
- `backend/src/modules/knowledge-base/knowledge-base.service.ts`
- `backend/src/modules/qdrant/qdrant.service.ts`

## 3. High-Value Engineering Patterns

### GOLD patterns

1. Unified AI gateway with provider failover
   - File: `backend/src/modules/ai/ai.service.ts`
   - Class: `AiService`
   - Function: `complete`, `completeFallback`, `getClient`, `getModel`
   - Why it matters: one API surface handles OpenRouter and direct OpenAI fallback.

2. Structured JSON generation contract
   - File: `backend/src/modules/ai/ai.service.ts`
   - Class: `AiService`
   - Function: `completeJson`
   - Why it matters: AI output is parsed and validated as structured data rather than free-form text.

3. Multi-agent orchestration for educational reasoning
   - File: `backend/src/modules/problem-solver/problem-solver.service.ts`
   - Class: `ProblemSolverService`
   - Functions: `solve`, `solveStream`
   - Why it matters: specialized reasoning roles are chained in a clear sequence.

4. Generic base agent abstraction
   - File: `backend/src/modules/problem-solver/agents/base.agent.ts`
   - Class: `BaseAgent`
   - Why it matters: all agents share a common prompt-building + JSON execution + streamed response pattern.

5. RAG pipeline from document upload to retrieval
   - File: `backend/src/modules/knowledge-base/knowledge-base.service.ts`
   - Function: `processDocument`, `addText`, `searchMultiple`
   - Why it matters: ingestion, chunking, embedding, vector search, and access filtering are explicit.

6. Vector retrieval with payload filters
   - File: `backend/src/modules/qdrant/qdrant.service.ts`
   - Functions: `searchWithPayloadFilter`, `deleteByFilter`
   - Why it matters: retrieval is scoped to `workspace_id` and user-owned data.

7. User-scope enforcement using `findByIdWithAccess`
   - File: `backend/src/modules/knowledge-base/knowledge-base.service.ts`
   - Function: `findByIdWithAccess`
   - Why it matters: access checks are enforced before reads/writes, not just at the controller layer.

8. Citation-provenance tracking with numeric references
   - File: `backend/src/modules/chat/chat.service.ts`
   - Interface: `Citation`
   - Why it matters: models output citations as structured metadata tied to retrieval results.

9. SSE streaming with progressive UI updates
   - File: `backend/src/modules/chat/chat.controller.ts`
   - Function: `sendMessageStream`
   - Frontend file: `frontend/src/services/chat.ts`
   - Why it matters: chat responses are streamed token-by-token and citation events are emitted separately.

10. Background job processing for long-running tasks
   - File: `backend/src/modules/queue/queue.service.ts`
   - Class: `QueueService`
   - Why it matters: heavy indexing jobs are decoupled from request latency.

### GOOD patterns

11. Prompt scaffolding via reusable formatter helpers
   - File: `backend/src/modules/ai/ai.service.ts`
   - Function: `buildSystemPrompt`
   - Why it matters: prompt templates can be reused and parameterized.

12. Multimodal document understanding for PDF and image analysis
   - File: `backend/src/modules/chat/chat.service.ts`
   - Function: `sendMessageWithFiles`
   - Why it matters: human-document workflows are supported beyond raw text queries.

13. Global auth and role enforcement in Spring Boot
   - File: `backend/src/app.module.ts`
   - File: `backend/src/common/guards/jwt-auth.guard.ts`
   - Why it matters: cross-cutting auth is centralized and consistent.

14. Feature gating with plan metadata
   - File: `backend/src/common/guards/plan.guard.ts`
   - Why it matters: product features can be gated without repeated custom authorization code.

15. Centralized frontend API configuration
   - File: `frontend/src/config/api.ts`
   - Why it matters: feature pages can be refactored without rewriting HTTP clients.

## 4. AI Generation Architecture

### Pattern: centralized AI access layer

File: `backend/src/modules/ai/ai.service.ts`
Class: `AiService`

This service is the primary AI integration layer. It chooses between OpenRouter and direct OpenAI, injects provider headers, manages model configuration, and exposes methods for:
- `complete()`
- `completeJson()`
- `generateWithVision()`
- `streamComplete()`
- `generateWithRetry()`

This is a strong transferable pattern because all AI usage goes through a single abstraction instead of each feature reimplementing provider logic.

Reusable principle:
- provider selection is encapsulated
- request validation occurs before sending to the model
- fallback logic is explicit
- retry is implemented centrally

### Example reusable abstraction

GenerationContract:
- input messages
- output schema
- optional stream
- retry policy
- provider fallback
- validated parse step

### Direct evidence

- `AiService.getClient()` chooses OpenRouter first and OpenAI as fallback.
- `AiService.complete()` catches provider failure and calls `completeFallback()`.
- `AiService.completeJson()` strips Markdown fences before `JSON.parse()`.
- `AiService.streamComplete()` yields token chunks for progressive display.

## 5. Prompt Engineering Patterns

### Pattern 1: system prompt + task prompt + context injection

File: `backend/src/modules/chat/chat.service.ts`
Class: `ChatService`
Function: `buildMessageHistory`

This function composes a system prompt that tells the model how to behave, then injects context from retrieved files and prior conversation history. The pattern is:
1. fixed behavioral instruction
2. data-driven context block
3. user message
4. prior chat history

This is a strong transfer pattern because prompts are not manually hardcoded in each endpoint; they are composed consistently.

### Pattern 2: JSON output enforcement

File: `backend/src/modules/ai/ai.service.ts`
Function: `completeJson`

The method calls `complete()` with `responseFormat: { type: 'json_object' }`, then sanitizes and parses the response. If parsing fails, it throws a `BadRequestException`.

This is important because it turns AI responses into valid internal objects instead of leaving them as strings.

### Pattern 3: prompt contained with domain-specific constraints

File: `backend/src/modules/ai/ai.controller.ts`
Class: `AiController`
Function: `generateFlashcards`

The system prompt explicitly defines:
- exact card count
- requirement for quality
- question types
- output structure

This is a good pattern for Teacher Copilot: create a domain-specific generator with explicit output schema and domain constraints rather than letting the model choose its own format.

### Pattern 4: multi-step prompt scaffolding for research

File: `backend/src/modules/research/research.service.ts`
Function: `research`

The research flow uses:
- planning prompt to generate subtopics and search queries
- source compilation prompt to collect knowledge base and web results
- synthesis prompt with explicit JSON contract and citation instruction

This pattern is highly reusable for AI tutoring, lesson plan creation, or lesson synthesis pipelines.

### Pattern 5: language-aware prompt instructions

File: `backend/src/modules/problem-solver/agents/base.agent.ts`
Class: `BaseAgent`
Function: `buildMessages`

The agent detects the input language via Unicode ranges and instructs model output to remain in the same script/language. This is a practical guardrail pattern for multilingual tutor contexts.

### Transferable reusable template

PromptTemplate:
- System: role, safety guardrails, domain constraints
- User/task: problem or action to perform
- Context: retrieved records, conversation history, documents
- Output contract: exact JSON schema or markdown format
- Validation: parser + schema check + retry

## 6. Agent Architecture Patterns

### Pattern: orchestrated specialist agents

File: `backend/src/modules/problem-solver/problem-solver.service.ts`
Class: `ProblemSolverService`
Functions: `solve`, `solveStream`

The reference architecture uses a specialized agent pipeline:
- `AnalysisAgent`
- `SolverAgent`
- `VerifierAgent`
- optional `HintAgent`, `AlternativeMethodAgent`

Agent coordination happens by building an `AgentContext` object and passing `previousSteps` across execution boundaries. Each agent emits an `AgentResult` with:
- `output`
- `confidence`
- `reasoning`
- `metadata`

This is a strong pattern for AI Teacher Copilot because it turns one monolithic “answer the question” LLM action into observable stages with explicit verification.

### Base agent abstraction

File: `backend/src/modules/problem-solver/agents/base.agent.ts`
Class: `BaseAgent`

This generic abstraction defines:
- system prompt
- language detection
- message assembly
- JSON completion
- stream parsing

The designer intent is clearly reusable: special agent roles should not each invent their own execution pattern.

### Reusable abstraction

AgentPipeline:
- Stage 1: understand problem
- Stage 2: produce candidate answer
- Stage 3: verify or critique
- Stage 4: finalize / save artifacts

## 7. RAG Architecture Patterns

### Pattern: document-to-vector pipeline

File: `backend/src/modules/knowledge-base/knowledge-base.service.ts`
Class: `KnowledgeBaseService`
Function: `processDocument`

The pipeline is:
1. `DocumentProcessorService.processDocument(fileKey, mimeType)`
2. `cleanText()`
3. `ChunkingService.chunk(cleanedText)`
4. `EmbeddingService.embedWithChunking()`
5. `pgvectorService.upsertBatch()`
6. store chunk metadata in `document_chunks` table
7. retrieval via `searchMultiple()`

This is the most important reusable RAG pattern in the repository.

### Document processing

File: `backend/src/modules/knowledge-base/document-processor.service.ts`
Class: `DocumentProcessorService`

Supported types include:
- PDF (`pdf-parse`)
- plain text
- DOCX (`mammoth`)

The service extracts text and normalizes it before chunking. This is a good pattern for document ingestion in Teacher Copilot: normalize text, preserve metadata, and break into retrieval-ready chunks.

### Chunking design

File: `backend/src/modules/knowledge-base/chunking.service.ts`
Class: `ChunkingService`

The service uses paragraph-aware chunking with `chunkSize` and `chunkOverlap` and preserves offsets to allow downstream traceability. This is a valuable pattern because retrieval quality improves when chunks maintain semantic boundaries and source positions.

### Embedding design

File: `backend/src/modules/ai/embedding.service.ts`
Class: `EmbeddingService`

This service calls OpenRouter embeddings and supports batch embedding, similarity methods, and chunked embedding processing.

### Vector storage

File: `backend/src/modules/qdrant/qdrant.service.ts`
Class: `pgvectorService`

pgvector stores vectors in a collection prefix (`ai_teacher_copilot`) and includes payload filter support. The key transfer idea is scoped retrieval: search only within a specific collection or `workspace_id`.

### Retrieval + context formation

File: `backend/src/modules/chat/chat.service.ts`
Function: `sendMessage`

When the user sends a message, AI Teacher Copilot does:
- validate conversation ownership
- search attached KBs
- take top hits
- build context as `[1] ...` text blocks
- attach citations
- pass context into the LLM as part of system prompt or message history

This is a canonical pattern for grounded AI chat.

## 8. Citation / Provenance Patterns

### Pattern: source provenance is explicit

File: `backend/src/modules/chat/chat.service.ts`
Interface: `Citation`

Citation includes:
- `chunkId`
- `content`
- `documentId`
- `score`

The message payload stores citations as JSON in the database; the frontend then renders inline markers like `[1]`, `[2]` as clickable badges. This means the answer is anchored to a concrete source chunk rather than “some internal memory.”

### Research synthesis also tracks provenance

File: `backend/src/modules/research/research.service.ts`
Interface: `ResearchSource`

Each research source includes:
- `type`
- `title`
- `url`
- `content`
- `relevanceScore`

The synthesis prompt asks the model to produce sections with `sources: [1, 2]` and inline citations like `[1]`, `[2]`.

### Frontend provenance display

File: `frontend/src/pages/dashboard/ChatPage.tsx`
Function: `MessageBubble` and `CitationPanel`

The UI converts answer markers into clickable citation badges and shows a source panel with the relevant text. This is highly reusable for an AI Teacher Copilot answer panel, especially when teaching relies on source grounding.

## 9. Backend Patterns

### Pattern: modular service boundaries

File: `backend/src/app.module.ts`

Each domain has a separate Spring Boot feature module and service, reducing the risk of one AI or document feature contaminating another. This is a strong design pattern for any Teacher Copilot project because domain responsibilities remain explicit.

### Pattern: resource ownership checks in service layer

Examples:
- `backend/src/modules/chat/chat.service.ts` `getConversation()`
- `backend/src/modules/knowledge-base/knowledge-base.service.ts` `findByIdWithAccess()`
- `backend/src/modules/problem-solver/problem-solver.service.ts` `findByIdWithAccess()`

The service checks the current user against the resource owner before allowing access. This is a stronger boundary than controller-only auth.

### Pattern: parameterized SQL and domain-specific persistence

The service layer uses structured SQL insert/update queries with JSON serialization for arrays and metadata. This supports a clean separation between app logic and storage format.

### Pattern: global exception normalization

File: `backend/src/common/filters/http-exception.filter.ts`

The reference architecture uses a custom HTTP exception filter to normalize error output. This is a good pattern for error handling consistency.

## 10. API Patterns

### Pattern: API routes are centralized on the client

File: `frontend/src/config/api.ts`

The frontend groups endpoints by domain (`auth`, `chat`, `knowledgeBase`, `problemSolver`, `research`, etc.) with typed route builders.

### Pattern: SSE streaming over REST endpoints

File: `backend/src/modules/chat/chat.controller.ts`
Function: `sendMessageStream`

The endpoint sets `Content-Type: text/event-stream`, writes JSON chunks using `res.write()`, and ends the response after streaming completes. This is a reusable pattern for progressive AI output and is not limited to chat.

### Pattern: usage accounting linked to AI requests

The controller calls subscription logic before making AI generation requests, for example in `ChatController.sendMessage()` and `ChatController.sendMessageWithFiles()`.

This shows a design pattern: AI request consumption is tracked at the API boundary and not buried deep inside model classes.

## 11. Database Patterns

### Pattern: table-by-domain persistence with ownership fields

From the service queries and data model usage:
- `conversations` include `user_id`, `workspace_ids`
- `messages` include `conversation_id`, `citations`, `metadata`
- `workspaces` include `user_id`, `status`, `name`, `description`
- `document_chunks` include `workspace_id`, `document_id`, `chunk_index`, `content`, `metadata`
- `problem_solving_sessions` include `user_id`, `problem`, `subject`, `status`, `final_answer`, `is_correct`

This is a useful pattern for Teacher Copilot: tables should store resource ownership, generation metadata, and source links, not just a flat blob of content.

### Pattern: metadata as JSON is used heavily

Examples in `KnowledgeBaseService` and `ChatService`: `metadata` is stored as JSON and includes `startOffset`, `endOffset`, and source IDs. This gives traceability without hard-wiring all provenance into columns.

### Pattern: vector payload mirrors relational metadata

The vector store includes metadata like `workspace_id`, `documentId`, `chunkIndex`, and sometimes `userId`-like realms. This pattern is highly reusable: keep the vector payload compact but enough to support filtering and provenance.

## 12. Security Patterns

### Pattern: JWT auth + route-level metadata

File: `backend/src/modules/auth/strategies/jwt.strategy.ts`
File: `backend/src/common/guards/jwt-auth.guard.ts`

JWT is extracted from the Authorization header. The `JwtStrategy` validates user existence and attaches the payload to the request. The global `JwtAuthGuard` skips public routes by using `@Public()`.

### Pattern: role-based access control

File: `backend/src/common/guards/roles.guard.ts`

This pattern is straightforward and reusable: declare required roles via a decorator, read them from metadata, and enforce them on the request user.

### Pattern: plan/feature gating

File: `backend/src/common/guards/plan.guard.ts`

This is useful where premium or advanced AI features need gating. It enforces resource-level authorization to advanced capabilities.

### Pattern: user-scoped retrieval as a security rule

`findByIdWithAccess` patterns in the service layer prevent accidental cross-user retrieval. This is a core security rule for any AI Teacher Copilot: always scope retrieval by user or workspace.

### Pattern: prompt injection defense and retrieval isolation

Although AI Teacher Copilot implements a formal prompt firewall, the product architecture demonstrates good isolation by: 
- retrieving only relevant document chunks for the current KB
- placing retrieved context in explicit blocks
- generating citations from retrieved material instead of free-form web text alone
- using prompts that tell the model to answer based on source material

This is a practical defense-in-depth pattern.

## 13. Frontend Patterns

### Pattern: central service layer and explicit API configuration

File: `frontend/src/services/chat.ts`
File: `frontend/src/config/api.ts`

All UI pages interact with typed service wrappers rather than calling raw fetch everywhere. This reduces duplicated auth logic and keeps streaming handlers consistent.

### Pattern: progressive AI UI states

File: `frontend/src/pages/dashboard/ChatPage.tsx`

The page maintains states such as:
- `isSending`
- `streamingContent`
- `streamingCitations`
- `activeCitation`

This is a best-practice pattern for AI UX: user message sent, assistant streaming, interim citations, final merge into persisted message, and source side panel.

### Pattern: source-grounded answer display

`MessageBubble.renderContent()` replaces citation markers like `[1]` with clickable badges and allows the user to inspect the source. This is a highly reusable pattern for educational AI: references remain visible and inspectable.

## 14. Async / Queue / Streaming Patterns

### Pattern: async document processing

File: `backend/src/modules/knowledge-base/knowledge-base.service.ts`
Function: `addDocument`

The system enqueues a job via `QueueService.addJob('knowledge-base', 'process-document', ...)` and handles the actual indexing asynchronously.

### Pattern: BullMQ queue abstraction

File: `backend/src/modules/queue/queue.service.ts`
Class: `QueueService`

This is a reusable pattern for background AI tasks, indexing, or long-running generation jobs. It supports worker registration, progress tracking, queue events, bulk operations, and cleanup.

### Pattern: streaming AI responses

File: `backend/src/modules/ai/ai.service.ts` `streamComplete()`
File: `backend/src/modules/chat/chat.controller.ts` `sendMessageStream()`
File: `frontend/src/services/chat.ts` `sendMessageStream()`

This pattern splits AI generation into small chunks that can be progressively rendered while preserving the final assembled message.

## 15. Testing Patterns

AI Teacher Copilot emphasizes a large public test suite in the inspected modules; the most visible patterns are service-level validation and defensive error handling, not large formalized test pyramids. However, the codebase does demonstrate a meaningful testing mindset:

- Some domain logic is protected through clear preconditions and runtime validation.
- Error-handling branches catch provider failures and malformed JSON outputs.
- `BadRequestException` enforcement prevents invalid inputs from reaching AI generation.

For a Teacher Copilot project, these patterns should be captured as service-level validation tests, especially around:
- empty or too-short content rejection
- malformed JSON response parsing
- failed provider fallback
- unauthorized KB access
- invalid file type handling
- streaming error paths

## 16. Reusable AI Generation Templates

### Template A: Safety + context + schema prompt

```ts
const messages = [
  { role: 'system', content: 'You are a tutor. Use only the provided context. Return valid JSON.' },
  { role: 'user', content: `Context:\n${context}\n\nTask:\n${task}` },
];

const result = await aiService.completeJson<T>(messages, {
  temperature: 0.4,
  maxTokens: 2000,
});
```

### Template B: orchestrated verification

```ts
const analysis = await analysisAgent.execute(context);
const solution = await solverAgent.execute({ ...context, previousSteps: [analysis] });
const verification = await verifierAgent.execute({
  ...context,
  previousSteps: [analysis, solution],
});
```

### Template C: streaming generator

```ts
for await (const chunk of aiService.streamComplete(messages, { maxTokens: 2048 })) {
  if (chunk.done) break;
  emit(chunk.content);
}
```

## 17. Reusable RAG Templates

### Template A: ingestion pipeline

```ts
const text = normalize(rawText);
const chunks = chunker.chunk(text);
const embeddings = await embedder.embedWithChunking(chunks.map((c) => c.content));
await vectorStore.upsertBatch(collectionName, chunks.map((chunk, i) => ({
  id: chunk.id,
  vector: embeddings[i].vector,
  payload: { sourceId: chunk.sourceId, chunkIndex: chunk.index },
})));
```

### Template B: scoped retrieval

```ts
const queryVector = await embedder.embed(query);
const results = await vectorStore.searchWithPayloadFilter(collectionName, queryVector.vector, 5, [
  { key: 'workspaceId', match: { value: currentWorkspaceId } },
]);
```

## 18. Reusable Agent Templates

```ts
abstract class BaseAgent {
  protected abstract agentName: string;
  protected abstract systemPrompt: string;

  async execute(context: AgentContext): Promise<AgentResult> {
    const messages = this.buildMessages(context);
    return this.aiService.completeJson<AgentResult>(messages);
  }
}
```

This pattern is a strong conceptual match for AI Teacher Copilot: stateful, specialized agents that can be chained and debugged individually.

## 19. Reusable Validation Templates

### Validation rule: AI output is untrusted

- parse JSON only after cleaning Markdown fences
- validate required keys
- re-run generation on parse failure
- fail closed when validation cannot be satisfied

This is a direct design principle captured from `AiService.completeJson()` and `BaseAgent.executeStream()`.

## 20. Feature Implementation Map

### Directly reusable

- centralized AI gateway
- structured JSON generation
- agent orchestration pattern
- RAG ingestion pipeline
- chunk overlap + source metadata
- citation rendering pattern
- SSE streaming
- global auth and resource-scoping

### Conceptually reusable

- educational-specific prompt design
- domain-specific user roles and plan gating
- multilingual prompt handling
- research synthesis prompt architecture
- progressive AI answer UX

### AI Teacher Copilot-specific

- educational product flows
- exam-clone domain logic
- learning analytics
- subscription/plan gating specifics
- knowledge-base product semantics

## 21. Patterns Deferred from MVP

1. The exact domain-specific learning product features
2. The exact database schema names and assumptions
3. The educational subscription model and plan gating specifics
4. AI Teacher Copilot’s product-specific prompt wording for educational tasks
5. The exact `workspace` concept if your Teacher Copilot uses a different workspace model
6. Proprietary app flow assumptions around a single educational platform
7. The exact UI layout and page structure of the frontend
8. Overreliance on one particular model/provider without provider abstraction
9. Hard-coded language-specific task wording for a different project domain
10. Copy-pasting whole feature flows without extracting the underlying abstractions

## 22. Important Lessons Learned

The most important takeaway from AI Teacher Copilot is not “use this AI stack.” It is this:

- AI generation should be treated as an untrusted external system.
- Every prompt should specify behavior, context, and output contract.
- Every response should be validated and parsed before use.
- Retrieval results should be scoped, cited, and visible to the user.
- Multi-stage AI workflows are easier to debug than one giant monolithic prompt.
- Streaming makes AI more interactive, but it must still preserve final correctness and provenance.
- Security and access boundaries must be enforced at the resource service layer, not only in controllers.

This is the main reusable engineering lesson for an AI Teacher Copilot project: build a disciplined AI system around contracts, provenance, validation, and scope control rather than raw model prompting.

## Reference Files (AI Teacher Copilot Stack)

- `backend/src/app.module.ts`
- `backend/src/common/guards/jwt-auth.guard.ts`
- `backend/src/common/guards/roles.guard.ts`
- `backend/src/common/guards/plan.guard.ts`
- `backend/src/modules/ai/ai.service.ts`
- `backend/src/modules/ai/embedding.service.ts`
- `backend/src/modules/ai/ai.controller.ts`
- `backend/src/modules/chat/chat.service.ts`
- `backend/src/modules/chat/chat.controller.ts`
- `backend/src/modules/knowledge-base/knowledge-base.service.ts`
- `backend/src/modules/knowledge-base/chunking.service.ts`
- `backend/src/modules/knowledge-base/document-processor.service.ts`
- `backend/src/modules/qdrant/qdrant.service.ts`
- `backend/src/modules/problem-solver/problem-solver.service.ts`
- `backend/src/modules/problem-solver/agents/base.agent.ts`
- `backend/src/modules/problem-solver/agents/analysis.agent.ts`
- `backend/src/modules/problem-solver/agents/solver.agent.ts`
- `backend/src/modules/problem-solver/agents/verifier.agent.ts`
- `backend/src/modules/research/research.service.ts`
- `backend/src/modules/queue/queue.service.ts`
- `backend/src/modules/auth/auth.module.ts`
- `backend/src/modules/auth/strategies/jwt.strategy.ts`
- `frontend/src/config/api.ts`
- `frontend/src/services/chat.ts`
- `frontend/src/pages/dashboard/ChatPage.tsx`
- `README.md`

## Final Note

This file is intentionally a transfer library. It focuses on the engineering principles embedded in AI Teacher Copilot’s implementation, not the exact product features or app-specific schema. A Teacher Copilot project should adapt these patterns to its stack, resource model, data model, and feature set while preserving the underlying system design.
