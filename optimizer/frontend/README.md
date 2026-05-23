# Frontend (VS Code webview)

React + TypeScript + Tailwind UI for the Rosruc Docker optimizer panel. The same bundle runs in the browser during development and inside a VS Code webview in production.

## Local development

```powershell
cd optimizer/frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API calls proxy to `http://localhost:8000` via `/api/*`.

By default, local dev uses demo data (see `.env.development`) so the UI works without the backend. To hit the real API:

1. Start the backend (from repo root):

```powershell
cd optimizer
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd backend
uvicorn app.main:app --reload --port 8000
```

2. Set `VITE_USE_DEMO_DATA=false` in `.env.development` and restart `npm run dev`.

## Build for VS Code

```powershell
npm run build
```

Output lands in `dist/`. The extension host loads `dist/index.html` as the webview entry point.

## VS Code integration (for the extension team)

Extension host code is TypeScript (`vscode` API). The webview UI stays React — that is the standard pattern for richer panels.

Minimal wiring:

```typescript
import * as vscode from 'vscode'
import * as path from 'path'

panel.webview.html = getWebviewHtml(panel.webview, extensionUri)

panel.webview.onDidReceiveMessage(async (message) => {
  if (message.type === 'submitPreferences') {
    const res = await fetch('http://localhost:8000/optimize/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.payload),
    })
    panel.webview.postMessage({ type: 'submitResult', payload: await res.json() })
  }

  if (message.type === 'getSavings') {
    const res = await fetch('http://localhost:8000/savings/aggregate')
    panel.webview.postMessage({ type: 'savingsUpdate', payload: await res.json() })
  }
})
```

### Webview messages

| Direction | Type | Payload |
|-----------|------|---------|
| Webview → Extension | `ready` | — |
| Webview → Extension | `submitPreferences` | `{ auto_mode, strategy, interval }` |
| Webview → Extension | `getSavings` | — |
| Webview → Extension | `getHardware` | — |
| Extension → Webview | `submitResult` | `{ ok, message?, savings? }` |
| Extension → Webview | `savingsUpdate` | savings comparison object |
| Extension → Webview | `hardwareUpdate` | `{ compute_power: "cpu" \| "gpu" }` |

### Preference payload

```json
{
  "auto_mode": true,
  "strategy": "layer_cache",
  "interval": "1h",
  "compute_power": "cpu"
}
```

Strategy values: `layer_cache`, `multi_stage_slim`, `parallel_buildkit`

Interval values: `30m`, `45m`, `1h`, `2h`, `manual`

Compute power values: `cpu`, `gpu` (in Auto mode the extension detects hardware and sends `hardwareUpdate`)

## Feasibility

- **Frontend panel (this folder):** ready now; `npm run dev` or `npm run build`.
- **Full VS Code extension:** ~1–2 hours for whoever owns the extension scaffold (manifest, activation, webview panel, message bridge to backend).
