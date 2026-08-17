from app.retrieval.service import search_similar_chunks
from app.providers.gemini import generate_structured_output
from app.generation.schemas import LessonPlan, Quiz

async def generate_lesson_plan_service(workspace_id: str, subject: str, grade_level: str, topic: str, instructions: str):
    # 1. Retrieve context
    query = f"{subject} {grade_level} {topic} {instructions or ''}"
    chunks = await search_similar_chunks(query, workspace_id, top_k=5)
    
    context_text = "\n\n".join([f"Source [{i}]: {c.content}" for i, c in enumerate(chunks)])
    
    # 2. Build prompt
    prompt = f"""
    Create a lesson plan for:
    Subject: {subject}
    Grade Level: {grade_level}
    Topic: {topic}
    Additional Instructions: {instructions or 'None'}
    
    Use the following retrieved knowledge context (RAG) to ground your lesson plan:
    ---
    {context_text}
    ---
    """
    
    # 3. Call LLM
    result = await generate_structured_output(prompt, LessonPlan)
    return result

async def generate_quiz_service(workspace_id: str, subject: str, grade_level: str, topic: str, num_questions: int, instructions: str):
    query = f"{subject} {grade_level} {topic} {instructions or ''}"
    chunks = await search_similar_chunks(query, workspace_id, top_k=5)
    
    context_text = "\n\n".join([f"Source [{i}]: {c.content}" for i, c in enumerate(chunks)])
    
    prompt = f"""
    Create a quiz with {num_questions} questions for:
    Subject: {subject}
    Grade Level: {grade_level}
    Topic: {topic}
    Additional Instructions: {instructions or 'None'}
    
    Use the following retrieved knowledge context (RAG):
    ---
    {context_text}
    ---
    """
    
    result = await generate_structured_output(prompt, Quiz)
    return result
