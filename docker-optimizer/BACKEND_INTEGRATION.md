# 🚀 Docker-Optimizer Suite: Technical Architecture & Handoff

## 📌 The 3-Act Narrative
Our system is designed as a logical progression: **Diagnose** (Act 1) → **Cure** (Act 2) → **Immunize** (Act 3). We move the developer from "Why is this slow?" to "It will never be slow again."

---

## 🎭 Act 1: Dockalyzer (The Diagnostician)

### ❓ The "Why" (The Pain Point)
Docker is a "black box." When a build is slow, developers see walls of text but don't know which specific line in their Dockerfile caused the cache to break. One misplaced `COPY` command can trigger a 1-hour re-installation of dependencies.

### 🛠️ The "What" (The Solution)
Dockalyzer taps into BuildKit's internal JSON stream. It visually maps the layer tree in real-time and pinpoints the **"Cache Bust"**—the exact moment Docker stopped using the cache and started fresh.

### 📡 The Handoff (Communication)
*   **Data Exported:** It identifies the `busted_line` (e.g., `COPY . .`).
*   **Handoff to Act 2:** It passes this "culprit" to AutoStage so the AI knows exactly which instruction needs to be moved or re-layered.

---

## 🎭 Act 2: AutoStage (The Architect)

### ❓ The "Why" (The Pain Point)
Most Dockerfiles are "unaware" of the project they contain. They install libraries that are never used (Bloat) and order commands in a way that maximizes rebuild time (Inefficiency).

### 🛠️ The "What" (The Solution)
AutoStage performs two high-intelligence tasks:
1.  **Codebase Tree-Shaking:** It scans the actual source code (`.py`, `.js`, etc.) to see which libraries are actually imported. It then tells the AI to delete any `apt-get` or `pip` installs not found in the code.
2.  **Smart Refactoring:** Using the "Bust Report" from Act 1, the AI re-orders the Dockerfile to "lock" heavy dependencies in early stages and puts volatile code at the very end.

### 📡 The Handoff (Communication)
*   **Hot-Swap Preparation:** AutoStage modifies the Dockerfile `CMD` to use a live-reloader (like `uvicorn --reload`).
*   **Handoff to Act 3:** It builds this "Hot-Swap Ready" image and launches a container, then signals HotDock to start watching for changes.

---

## 🎭 Act 3: HotDock (The Speed Demon)

### ❓ The "Why" (The Pain Point)
Even an optimized 10-second build is too slow for a developer in the "flow." Rebuilding and restarting containers thousands of times a day wastes hours of cumulative time.

### 🛠️ The "What" (The Solution)
HotDock is a "Zero-Build" engine. It watches local file changes and uses `docker cp` to surgically inject the modified file directly into the running container in milliseconds (~15ms). Because Act 2 set up a "Live Reloader," the app updates instantly without a restart.

---

## 🔄 The Communication Loop (How they talk)

1.  **Act 1 → Act 2:** "Hey, I found the problem. The cache broke at the `COPY` command on Line 7."
2.  **Act 2 → Act 3:** "Got it. I've rewritten the Dockerfile to fix Line 7 and removed 400MB of unused libraries I found in the source code. I've also enabled 'Live Reload' mode. Act 3, you are clear to take over syncing."
3.  **Act 3 → Developer:** "The environment is now optimized. Stop building. Just save your code; I'll handle the rest."

---

## 📊 Data Integration for Frontend

### 1. Performance Manifest (`performance_manifest.json`)
The Frontend should use this file to generate the **"Before vs. After"** charts.
```json
{
    "metrics": {
        "build_time": {"before": 45.2, "after": 12.1},
        "image_size": {"before": 950.0, "after": 120.0}
    },
    "savings": {
        "time": "73.2%",
        "size": "87.4%"
    },
    "bloat_removed": "Removed: git, vim, gcc, wget..."
}
```
### 2. Live Sync Events
Every time a user saves a file, the backend emits a real-time event log. Use this to trigger "Pulse" animations or toast notifications in the UI.
*   **Format:** `⚡ Hot-Swap: [FILENAME] ( [TIME]ms )`
*   **UI Suggestion:** Update a "Last Synced" timestamp in the sidebar to show the user how much time they are saving.

---

## 🚀 Execution Commands

To run the suite for the demo, use the following commands from the project root:

### The Full Integrated Demo
```bash
python main.py


---

## 🌐 API Integration (For Frontend & Extension Teammates)

To make it easy for the UI to talk to the Backend, we have exposed the 3-Act Suite as a **REST API** using FastAPI.

### 🔌 Connection Details
- **Base URL:** `http://localhost:8000`
- **Format:** `application/json`
- **Swagger Docs:** `http://localhost:8000/docs` (Use this to test endpoints manually)

### 🛣️ Endpoints

#### 1. POST `/analyze`
*   **What it does:** Triggers **Act 1 (Dockalyzer)**.
*   **Flow:** Runs a Docker build, monitors the layer tree, and identifies the cache-bust.
*   **Response:**
    ```json
    {
        "busted_line": "COPY . .",
        "status": "success"
    }
    ```
*   **UI Hint:** Call this when the user clicks "Scan Project." Save the `busted_line` in your frontend state; you'll need it for the next call.

#### 2. POST `/optimize`
*   **What it does:** Triggers **Act 2 (AutoStage)**.
*   **Payload:** Expects the `busted_line` from Act 1.
*   **Response:** Returns the full `performance_manifest.json` data.
*   **UI Hint:** Use the `savings` and `metrics` objects in the response to render your "Before vs After" graphs and "Speed Increase" badges.

#### 3. POST `/watch`
*   **What it does:** Triggers **Act 3 (HotDock)**.
*   **Mechanism:** Launches the optimized container and starts the "Zero-Build" filesystem watcher in the background.
*   **Response:** `{"status": "Live Sync Started", "container": "autostage-dev-container"}`
*   **UI Hint:** Once this is called, the backend will handle all file syncing. You just need to show a "Live Sync Active" status in the UI.

---

## 🏗️ State Management
The API maintains a small internal state. For the demo to flow correctly, the UI should follow this sequence:
1.  **Call `/analyze` first** to get the diagnostics.
2.  **Call `/optimize` second** to perform the refactor based on those diagnostics.
3.  **Call `/watch` last** to enter the high-speed development loop.

## 🛠️ Developer "Emergency" CLI
If the UI or API has a connection issue during the live demo:
- Run `python main.py`. 
- This is our **"Plan B"** integrated CLI. It runs the exact same logic as the API but outputs directly to the terminal using beautiful **Rich** formatting. It is the fail-safe for the demo.