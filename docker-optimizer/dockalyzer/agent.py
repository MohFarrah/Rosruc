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

genai.configure(api_key=os.environ.get('GOOGLE_API_KEY', 'YOUR_API_KEY'))
model = genai.GenerativeModel('gemini-2.0-flash')

def get_ai_analysis(status, dockerfile_content, busted_line=None):
    """
    Analyzes the Docker build result for the Dockalyzer UI.
    Act 1 of the Docker-Optimizer Suite.
    """

    if status == 'busted':
        prompt = f"""
You are Act 1 (The Diagnostician) of the Docker-Optimizer Suite. 
A developer's build just hit a cache-bust bottleneck.

CULPRIT LINE: "{busted_line}"
DOCKERFILE:
{dockerfile_content}

TASK:
1. Explain the "Chain Reaction": Did this bust trigger a "one-hour build" (e.g., re-running heavy compilers or dependency installs)?
2. Identify why this line is poorly placed (e.g., "You copied the whole project before running pip install").
3. HANDOFF: Explain that AutoStage (Act 2) will now take over to automatically refactor this architecture into a "Hot-Swap Ready" state.
4. KEEP IT BRIEF: Use 3 bullet points maximum.
"""
    else:
        prompt = f"""
You are Act 1 (The Diagnostician) of the Docker-Optimizer Suite.
The build was 100% CACHED.

DOCKERFILE:
{dockerfile_content}

TASK:
1. Congratulate the developer on an efficient build.
2. Explain that because the base layers are stable, they are now perfectly positioned for "Act 3: HotDock" (Zero-Build mode).
3. Suggest that we still run "Act 2: AutoStage" to ensure no unused dependencies (bloat) are hiding in the image.
"""
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f'Agent was unable to analyze logs: {str(e)}'