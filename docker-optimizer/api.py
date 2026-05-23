from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
import json
import os

# Import your core logic
from dockalyzer.dockalyzer import Dockalyzer
from autostage.autostage import AutoStage

app = FastAPI(title="Docker Optimizer API")

# Allow the frontend to talk to this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state to store findings between calls
state = {
    "busted_line": None,
    "project_path": "./examples"
}

@app.get("/health")
def health():
    return {"status": "ready"}

@app.post("/analyze")
def analyze_build():
    """ACT 1: Run Dockalyzer and return findings."""
    ana = Dockalyzer(path=state["project_path"])
    busted_line = ana.run()
    state["busted_line"] = busted_line
    
    # Return the data for the UI to display
    return {
        "busted_line": busted_line,
        "status": "success" if busted_line else "optimized"
    }

@app.post("/optimize")
def optimize_build():
    """ACT 2: Run AutoStage optimization."""
    ref = AutoStage(target_dir=state["project_path"])
    ref.run(bust_info=state["busted_line"])
    
    # Read the manifest we just generated to send to the UI
    manifest_path = os.path.join(state["project_path"], "performance_manifest.json")
    with open(manifest_path, "r") as f:
        manifest_data = json.load(f)
        
    return manifest_data

@app.post("/watch")
def start_hotdock(background_tasks: BackgroundTasks):
    """ACT 3: Launch the container and start HotDock in the background."""
    ref = AutoStage(target_dir=state["project_path"])
    
    # We run this as a background task so the API doesn't hang
    background_tasks.add_task(ref.launch_dev_mode)
    
    return {"status": "Live Sync Started", "container": "autostage-dev-container"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)