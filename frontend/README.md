# Frontend (VS Code webview)

React + TypeScript + Tailwind UI for the Rosruc Docker optimizer panel. The same bundle runs in the browser during development and inside a VS Code webview in production.

## Local development

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. API calls proxy to `http://localhost:8000` via `/api/*`.

By default, local dev uses demo data (see `.env.development`) so the UI works without the backend. To hit the real API:

1. Start the docker-optimizer API (from repo root):

```powershell
cd docker-optimizer
pip install fastapi uvicorn
python api.py
```

2. Set `VITE_USE_DEMO_DATA=false` in `.env.development` and restart `npm run dev`.

On submit, the UI runs the 3-act pipeline in order: `POST /analyze` → `POST /optimize` → `POST /watch`.

## Build for VS Code

```powershell
npm run build
```

Output lands in `dist/`. The extension host loads `frontend/dist/index.html` as the webview entry point.

## VS Code integration (for the extension team)

Extension host code is TypeScript (`vscode` API). The webview UI stays React — that is the standard pattern for richer panels.

Minimal wiring:

```typescript
panel.webview.onDidReceiveMessage(async (message) => {
  if (message.type === 'submitPreferences') {
    const analyze = await fetch('http://localhost:8000/analyze', { method: 'POST' })
    const optimize = await fetch('http://localhost:8000/optimize', { method: 'POST' })
    const watch = await fetch('http://localhost:8000/watch', { method: 'POST' })
    panel.webview.postMessage({
      type: 'submitResult',
      payload: {
        ok: true,
        pipeline: {
          analyze: await analyze.json(),
          manifest: await optimize.json(),
          watch: await watch.json(),
        },
      },
    })
  }
})
```

### Webview messages

| Direction | Type | Payload |
|-----------|------|---------|
| Webview → Extension | `ready` | — |
| Webview → Extension | `submitPreferences` | `{ auto_mode, strategy, interval, compute_power }` |
| Webview → Extension | `getSavings` | — |
| Webview → Extension | `getHardware` | — |
| Extension → Webview | `submitResult` | `{ ok, message?, savings?, pipeline? }` |
| Extension → Webview | `savingsUpdate` | savings comparison object |
| Extension → Webview | `hardwareUpdate` | `{ compute_power: "cpu" \| "gpu" }` |
| Extension → Webview | `syncEvent` | `{ filename, durationMs, message, syncedAt }` |

## Feasibility

- **Frontend panel (this folder):** ready now; `npm run dev` or `npm run build`.
- **Full VS Code extension:** wire the extension host to load `frontend/dist/` and relay messages to `docker-optimizer` API.
