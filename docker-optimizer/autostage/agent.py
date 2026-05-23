import google.generativeai as genai
import os

# Configuration
genai.configure(api_key=os.environ.get("GOOGLE_API_KEY", "YOUR_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

def refactor_dockerfile(content, used_libs=None, bust_info=None):
    """
    Consolidated Agent: Handles both Idea 1 (Cache-Bust) and Idea 2 (Refactoring/Pruning).
    """
    
    # 1. Prepare the Context for the AI
    libs_context = f"The source code only uses these libraries: {', '.join(used_libs) if used_libs else 'Not Scanned'}"
    bust_context = f"DANGER: The previous build broke cache at: '{bust_info}'. Fix the layer order to prevent this." if bust_info else ""

    # 2. The "Elite DevOps" System Prompt
    prompt = f"""
    You are an Elite DevOps Engineer specializing in Docker Optimization.
    
    CONTEXT FROM CODEBASE SCAN:
    {libs_context}
    
    CONTEXT FROM BUILD LOGS (DOCKALYZER):
    {bust_context}
    
    ORIGINAL DOCKERFILE:
    {content}
    
    YOUR MISSION:
    1. TREE-SHAKING: Remove any 'apt-get install' or 'pip/npm install' packages not mentioned in the used libraries list (unless they are essential build tools).
    2. CACHE OPTIMIZATION: Re-order instructions so that heavy dependencies (requirements.txt/package.json) are copied and installed BEFORE the source code.
    3. MULTI-STAGE: Use a multi-stage build (Builder stage and Runner stage) with a slim/alpine base image.
    4. SPEED: If there is a compilation step taking too long, use --mount=type=cache.

    OUTPUT FORMAT (STRICT):
    REMOVED_BLOAT: (List specifically which packages you removed and why)
    EXPLANATION: (2-3 bullet points on the architectural fix)
    NEW_DOCKERFILE: (The full code block)
    ESTIMATED_SIZE: (Size category: Small/Medium/Large)
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Agent Error: {str(e)}"