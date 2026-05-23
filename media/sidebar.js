(function () {
  const vscode = acquireVsCodeApi();

  const mode = document.getElementById("mode");
  const interval = document.getElementById("interval");
  const auto = document.getElementById("auto");
  const submit = document.getElementById("submit");
  const status = document.getElementById("status");
  const before = document.getElementById("before");
  const after = document.getElementById("after");
  const summary = document.getElementById("summary");
  const recommendation = document.getElementById("recommendation");
  const details = document.getElementById("details");

  const intervalLabels = {
    "30s": "30 seconds",
    "1m": "1 minute",
    "5m": "5 minutes",
    "20m": "20 minutes",
    none: "manual",
  };

  function selectedPayload() {
    return {
      command: "runOptimizer",
      mode: mode.value,
      interval: interval.value,
      auto: auto.checked,
    };
  }

  function autoStatusText() {
    if (interval.value === "none") {
      return "Auto Optimize is on, but interval is set to manual.";
    }

    return `Auto Optimize running every ${intervalLabels[interval.value]}.`;
  }

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle("error", Boolean(isError));
  }

  function applyModeState() {
    mode.disabled = auto.checked;
    submit.disabled = auto.checked;
    interval.disabled = auto.checked;

    if (auto.checked) {
      setStatus(autoStatusText(), false);
      return;
    }

    setStatus("Auto Optimize stopped. Manual mode enabled.", false);
  }

  function runSelectedOptimizer() {
    vscode.postMessage(selectedPayload());
  }

  function startOrRefreshAutoOptimize() {
    applyModeState();
    runSelectedOptimizer();
  }

  function renderResult(result) {
    if (result.status === "error") {
      setStatus(result.error || "The optimizer returned an error.", true);
      return;
    }

    before.textContent = result.beforeTime || "-";
    after.textContent = result.afterTime || "-";
    summary.textContent = result.summary || "No summary returned.";
    recommendation.textContent =
      result.recommendation || "No recommendation returned.";

    const extra = {
      details: result.details || {},
      notes: result.notes || result.agentNotes || [],
      warning: result.warning || result.warnings || null,
    };
    details.textContent = JSON.stringify(extra, null, 2);

    if (auto.checked) {
      setStatus(autoStatusText(), false);
      return;
    }

    setStatus(`Finished ${result.mode || "optimizer"} run. Manual mode enabled.`, false);
  }

  submit.addEventListener("click", () => {
    if (auto.checked) {
      return;
    }

    setStatus("Running optimizer...", false);
    runSelectedOptimizer();
  });

  auto.addEventListener("change", () => {
    if (!auto.checked) {
      vscode.postMessage({
        command: "setAutoOptimize",
        auto: false,
      });
      applyModeState();
      return;
    }

    startOrRefreshAutoOptimize();
  });

  interval.addEventListener("change", () => {
    if (!auto.checked) {
      return;
    }

    startOrRefreshAutoOptimize();
  });

  window.addEventListener("message", (event) => {
    const message = event.data;

    if (message.command === "optimizerLoading") {
      setStatus(`Running ${message.mode}...`, false);
      return;
    }

    if (message.command === "optimizerResult") {
      renderResult(message.result);
      return;
    }

    if (message.command === "optimizerError") {
      before.textContent = "-";
      after.textContent = "-";
      summary.textContent = "The optimizer could not complete.";
      recommendation.textContent =
        message.message || message.error || "Unknown extension error.";
      details.textContent = message.rawOutput || "{}";
      setStatus(message.message || message.error || "Optimizer failed.", true);
    }
  });

  mode.value = "dockalyzer";
  interval.value = "30s";
  auto.checked = true;
  applyModeState();
  runSelectedOptimizer();
})();
