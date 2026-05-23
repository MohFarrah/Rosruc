import { execFile } from "child_process";
import * as path from "path";
import * as vscode from "vscode";

type OptimizerMode = "dockalyzer" | "autostage" | "hotdock";
type OptimizerInterval = "30s" | "1m" | "5m" | "20m" | "none";

type RunOptimizerMessage = {
  command: "runOptimizer";
  mode: OptimizerMode;
  interval: OptimizerInterval;
  auto: boolean;
};

type AutoOptimizeMessage = {
  command: "setAutoOptimize";
  auto: boolean;
};

type WebviewMessage = RunOptimizerMessage | AutoOptimizeMessage;

const INTERVAL_MS: Record<OptimizerInterval, number> = {
  "30s": 30_000,
  "1m": 60_000,
  "5m": 300_000,
  "20m": 1_200_000,
  none: 0,
};

export class OptimizerSidebarProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private autoTimer?: ReturnType<typeof setInterval>;
  private lastRequest?: RunOptimizerMessage;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media"),
      ],
    };

    webviewView.webview.html = this.getHtml(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(
      (message: WebviewMessage) => {
        if (message.command === "runOptimizer") {
          this.handleRunOptimizer(message);
          return;
        }

        if (message.command === "setAutoOptimize" && !message.auto) {
          this.clearAutoTimer();
        }
      },
      undefined,
      this.context.subscriptions,
    );
  }

  private handleRunOptimizer(message: RunOptimizerMessage) {
    this.lastRequest = message;

    if (!message.auto || message.interval === "none") {
      this.clearAutoTimer();
      this.runOptimizer(message);
      return;
    }

    this.clearAutoTimer();
    this.runOptimizer(message);
    this.autoTimer = setInterval(() => {
      if (this.lastRequest) {
        this.runOptimizer(this.lastRequest);
      }
    }, INTERVAL_MS[message.interval]);
  }

  private clearAutoTimer() {
    if (this.autoTimer) {
      clearInterval(this.autoTimer);
      this.autoTimer = undefined;
    }
  }

  private runOptimizer(message: RunOptimizerMessage) {
    const backendCliPath = path.join(
      this.context.extensionPath,
      "backend",
      "cli.py",
    );
    const args = [
      backendCliPath,
      "--mode",
      message.mode,
      "--interval",
      message.interval,
      "--auto",
      String(message.auto),
    ];

    this.postMessage({
      command: "optimizerLoading",
      mode: message.mode,
    });

    execFile("python3", args, { cwd: this.context.extensionPath }, (error, stdout, stderr) => {
      if (error) {
        const isMissingPython = (error as NodeJS.ErrnoException).code === "ENOENT";
        this.postMessage({
          command: "optimizerError",
          message: isMissingPython
            ? "Python backend could not be started. Make sure python3 is installed."
            : stderr.trim() || error.message || "Python backend could not be started or returned an error.",
        });
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        this.postMessage({
          command: "optimizerResult",
          result,
        });
      } catch {
        this.postMessage({
          command: "optimizerError",
          message: "Backend returned invalid JSON.",
          rawOutput: stdout,
        });
      }
    });
  }

  private postMessage(message: unknown) {
    this.view?.webview.postMessage(message);
  }

  private getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "sidebar.js"),
    );
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline';">
  <title>Docker Dev Optimizer</title>
  <style>
    body {
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      font-family: var(--vscode-font-family);
      margin: 0;
      padding: 16px;
    }

    h1 {
      font-size: 18px;
      margin: 0 0 16px;
    }

    label {
      display: block;
      font-weight: 600;
      margin-bottom: 6px;
    }

    select,
    button {
      width: 100%;
    }

    select {
      background: var(--vscode-dropdown-background);
      border: 1px solid var(--vscode-dropdown-border);
      color: var(--vscode-dropdown-foreground);
      padding: 7px;
      margin-bottom: 14px;
    }

    button {
      background: var(--vscode-button-background);
      border: 0;
      color: var(--vscode-button-foreground);
      cursor: pointer;
      font-weight: 700;
      padding: 9px;
      margin: 10px 0 16px;
    }

    button:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .toggle-row {
      align-items: center;
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }

    .toggle-row input {
      margin: 0;
    }

    .metric-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 12px;
    }

    .metric,
    .panel {
      border: 1px solid var(--vscode-sideBarSectionHeader-border);
      background: var(--vscode-editor-background);
      padding: 10px;
    }

    .metric span,
    .panel span {
      color: var(--vscode-descriptionForeground);
      display: block;
      font-size: 11px;
      margin-bottom: 5px;
      text-transform: uppercase;
    }

    .metric strong {
      font-size: 16px;
    }

    .panel {
      margin-bottom: 10px;
      overflow-wrap: anywhere;
    }

    .panel p {
      margin: 0;
    }

    pre {
      margin: 0;
      max-height: 180px;
      overflow: auto;
      white-space: pre-wrap;
    }

    .status {
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      margin-bottom: 10px;
      min-height: 18px;
    }

    .error {
      color: var(--vscode-errorForeground);
    }
  </style>
</head>
<body>
  <h1>Docker Dev Optimizer</h1>

  <div class="toggle-row">
    <input id="auto" type="checkbox" checked>
    <label for="auto">Auto Optimize</label>
  </div>

  <label for="mode">Optimization</label>
  <select id="mode">
    <option value="dockalyzer">Dockalyzer</option>
    <option value="autostage">AutoStage</option>
    <option value="hotdock">HotDock</option>
  </select>

  <label for="interval">Interval</label>
  <select id="interval">
    <option value="30s">30 seconds</option>
    <option value="1m">1 minute</option>
    <option value="5m">5 minutes</option>
    <option value="20m">20 minutes</option>
    <option value="none">None / Manual</option>
  </select>

  <button id="submit">Submit</button>
  <div id="status" class="status">Ready.</div>

  <div class="metric-grid">
    <div class="metric">
      <span>Before</span>
      <strong id="before">-</strong>
    </div>
    <div class="metric">
      <span>After</span>
      <strong id="after">-</strong>
    </div>
  </div>

  <div class="panel">
    <span>Summary</span>
    <p id="summary">Run an optimizer to see a summary.</p>
  </div>

  <div class="panel">
    <span>Recommendation</span>
    <p id="recommendation">Recommendations will appear here.</p>
  </div>

  <div class="panel">
    <span>Details / Notes</span>
    <pre id="details">{}</pre>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i += 1) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
