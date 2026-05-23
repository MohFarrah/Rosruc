import google.generativeai as genai  # Corrected Import
import os

# Set up the API Key
genai.configure(api_key=os.environ.get('GOOGLE_API_KEY', 'YOUR_API_KEY'))
model = genai.GenerativeModel('gemini-1.5-flash')

def get_ai_analysis(status, dockerfile_content, busted_line=None):
    """
    Analyzes the Docker build result for the Dockalyzer UI.
    status: 'success' or 'busted'
    """

    if status == 'busted':
        prompt = f"""
You are a Senior DevOps Research Assistant. A developer's build just failed to use the cache.

CULPRIT LINE (The moment cache broke): "{busted_line}"
DOCKERFILE:
{dockerfile_content}

TASK:
1. Identify the specific file or change that likely caused this bust.
2. Explain the "Chain Reaction": Did this bust cause a "one-hour build" (like a full npm install or C++ compilation)?
3. Provide a 'Corrected Version' of the Dockerfile that reorders these layers for maximum speed.
4. Explain the time-saving benefit of this fix.
"""
    else:
        prompt = f"""
You are a Docker Performance Expert. The build was 100% CACHED.

DOCKERFILE:
{dockerfile_content}

TASK:
1. Congratulate the developer on an efficient, high-speed build.
2. Briefly explain why their current layer ordering is mathematically optimal.
3. Suggest one "Level 2" optimization (e.g., using multi-stage builds to prune unused dependencies or switching to a 'distroless' image).
"""
    try:
        # Use a higher temperature for more "human-like" developer feedback
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f'Agent was unable to analyze logs: {str(e)}'