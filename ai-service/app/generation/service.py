from app.retrieval.service import search_similar_chunks
from app.providers.factory import get_ai_provider
from app.generation.schemas import LessonPlan, Quiz

async def generate_lesson_plan_service(workspace_id: str, subject: str, grade_level: str, topic: str, instructions: str):
    # 1. Retrieve context
    query = f"{subject} {grade_level} {topic} {instructions or ''}"
    chunks = await search_similar_chunks(query, workspace_id, top_k=5)
    
    context_text = "\n\n".join([f"Source [{i}]: {c.content}" for i, c in enumerate(chunks)])
    
    # 2. Build prompt
    system_prompt = "You are a helpful AI assistant for teachers. You must output JSON based on the schema provided."
    user_prompt = f"""
    Create a lesson plan for:
    Subject: {subject}
    Grade Level: {grade_level}
    Topic: {topic}
    Additional Instructions: {instructions or 'None'}
    """
    
    context_chunks = [{"content": f"Source [{i}]: {c.content}"} for i, c in enumerate(chunks)]
    
    # 3. Call LLM
    provider = get_ai_provider()
    result = await provider.generate_structured_output(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        response_schema=LessonPlan,
        context_chunks=context_chunks
    )
    return result

async def generate_quiz_service(workspace_id: str, subject: str, grade_level: str, topic: str, num_questions: int, instructions: str):
    query = f"{subject} {grade_level} {topic} {instructions or ''}"
    chunks = await search_similar_chunks(query, workspace_id, top_k=5)
    
    context_text = "\n\n".join([f"Source [{i}]: {c.content}" for i, c in enumerate(chunks)])
    
    system_prompt = "You are a helpful AI assistant for teachers. You must output JSON based on the schema provided."
    user_prompt = f"""
    Create a quiz with {num_questions} questions for:
    Subject: {subject}
    Grade Level: {grade_level}
    Topic: {topic}
    Additional Instructions: {instructions or 'None'}
    """
    
    context_chunks = [{"content": f"Source [{i}]: {c.content}"} for i, c in enumerate(chunks)]
    
    provider = get_ai_provider()
    result = await provider.generate_structured_output(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        response_schema=Quiz,
        context_chunks=context_chunks
    )
    return result
