import google.generativeai as genai
import os
from pathlib import Path


def load_env_file(env_path):
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, value = stripped.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


load_env_file(Path(__file__).resolve().parents[1] / ".env")

# Configuration
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

def refactor_dockerfile(content, used_libs=None, bust_info=None):
    """
    Consolidated Agent: Act 2 (The Architect).
    Receives Diagnosis from Act 1 and prepares the environment for Act 3 (Hot-Swap).
    """
    
    if not GOOGLE_API_KEY:
        return "Agent Error: GOOGLE_API_KEY is not set. Add it to docker-optimizer/.env."

    # 1. Prepare the Context for the AI
    libs_context = f"The source code only uses these libraries: {', '.join(used_libs) if used_libs else 'Not Scanned'}"
    bust_context = f"ACT 1 REPORT: The build currently breaks at: '{bust_info}'. This is our primary target for re-layering." if bust_info else ""

    # 2. The "Suite-Aware" System Prompt
    prompt = f"""
    You are Act 2 (The Architect) of the Docker-Optimizer Suite. 
    Your job is to take the Diagnosis from Act 1 and refactor the Dockerfile to be "Hot-Swap Ready" for Act 3.
    
    INPUTS:
    - Codebase Analysis: {libs_context}
    - Cache-Bust Point: {bust_context}
    - Original Dockerfile: {content}
    
    YOUR MISSION:
    1. TREE-SHAKING: Remove any 'apt-get install' or 'pip/npm' packages not required by the code. 
    2. THE STABLE BASE: Move the "one-hour" heavy installation steps (dependencies) into an early, stable stage.
    3. HOT-SWAP READINESS: The application code (COPY . .) MUST be the very last instruction before the CMD. This ensures that Act 3 (HotDock) can inject files without invalidating heavy layers.
    4. LIVE-RELOAD: If the project is Python or Node, change the CMD to use a live-reloader (like 'uvicorn --reload', 'flask run', or 'nodemon') so that HotDock injections trigger instant app updates.

    OUTPUT FORMAT (STRICT):
    REMOVED_BLOAT: (List specifically which packages you removed and why)
    EXPLANATION: (Explain how you solved the 'one-hour build' and made the container 'Hot-Swap Ready' for Act 3)
    NEW_DOCKERFILE: (The full code block)
    ESTIMATED_SIZE: (Size category: Small/Medium/Large)
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"Agent Error: {str(e)}"
