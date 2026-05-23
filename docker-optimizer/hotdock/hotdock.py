import json
import os
import subprocess
import time
from pathlib import Path

from rich.console import Console
from watchdog.events import FileSystemEventHandler
from watchdog.observers import Observer

console = Console()

DEFAULT_CONFIG = {
    "container_name": "autostage-dev-container",
    "remote_dir": "/app",
    "mappings": {"./": "/app"},
    "ignore": ["__pycache__", ".git", "venv", ".venv", "node_modules", ".hotdockrc"],
}


class _HotDockHandler(FileSystemEventHandler):
    def __init__(self, hotdock: "HotDock"):
        self.hotdock = hotdock

    def on_modified(self, event):
        if event.is_directory:
            return
        self.hotdock.sync_file(event.src_path)

    def on_created(self, event):
        if event.is_directory:
            return
        self.hotdock.sync_file(event.src_path)


class HotDock:
    """Act 3: watch workspace files and docker cp them into the running container."""

    def __init__(self, project_path: str = "."):
        self.project_path = os.path.abspath(project_path)
        self.config = dict(DEFAULT_CONFIG)
        self._load_rc()

    def _load_rc(self) -> None:
        rc_path = os.path.join(self.project_path, ".hotdockrc")
        if not os.path.isfile(rc_path):
            return

        with open(rc_path, encoding="utf-8") as handle:
            loaded = json.load(handle)
        self.config.update(loaded)

    def _should_ignore(self, relative_path: str) -> bool:
        parts = Path(relative_path).parts
        ignored = set(self.config.get("ignore", []))
        return any(part in ignored for part in parts)

    def _remote_path(self, local_path: str) -> str | None:
        local = Path(local_path).resolve()
        project = Path(self.project_path).resolve()

        try:
            relative = local.relative_to(project).as_posix()
        except ValueError:
            return None

        if self._should_ignore(relative):
            return None

        mappings: dict[str, str] = self.config.get("mappings") or {"./": self.config["remote_dir"]}
        for local_prefix, remote_prefix in mappings.items():
            normalized_prefix = local_prefix.strip("./").strip("/")
            if normalized_prefix and not (relative == normalized_prefix or relative.startswith(f"{normalized_prefix}/")):
                if normalized_prefix != ".":
                    continue

            suffix = relative
            if normalized_prefix and normalized_prefix != "." and relative.startswith(f"{normalized_prefix}/"):
                suffix = relative[len(normalized_prefix) + 1 :]

            remote_base = remote_prefix.rstrip("/")
            return f"{remote_base}/{suffix}" if suffix else remote_base

        remote_base = self.config["remote_dir"].rstrip("/")
        return f"{remote_base}/{relative}"

    def sync_file(self, local_path: str) -> bool:
        container = self.config.get("container_name")
        remote_path = self._remote_path(local_path)

        if not container or not remote_path:
            return False

        start = time.perf_counter()
        result = subprocess.run(
            ["docker", "cp", local_path, f"{container}:{remote_path}"],
            capture_output=True,
            text=True,
        )
        elapsed_ms = int((time.perf_counter() - start) * 1000)
        filename = Path(local_path).name

        if result.returncode != 0:
            console.print(f"[bold red]Hot-Swap failed:[/bold red] {filename} — {result.stderr.strip()}")
            return False

        console.print(f"[bold orange3]⚡ Hot-Swap:[/bold orange3] {filename} ( {elapsed_ms}ms )")
        return True

    def start(self) -> None:
        container = self.config.get("container_name")
        if not container:
            raise ValueError("HotDock config missing container_name")

        console.print(
            f"[bold orange3]HotDock watching[/bold orange3] [white]{self.project_path}[/white] "
            f"→ [cyan]{container}[/cyan]"
        )

        handler = _HotDockHandler(self)
        observer = Observer()
        observer.schedule(handler, self.project_path, recursive=True)
        observer.start()

        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            observer.stop()
        observer.join()
