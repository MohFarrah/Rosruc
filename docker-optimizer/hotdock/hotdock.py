# main.py
import sys
import os
from rich.console import Console
from rich.panel import Panel

# Import our Suite
from dockalyzer.dockalyzer import Dockalyzer
from autostage.autostage import AutoStage

console = Console()

def run_hackathon_demo():
    # Setup - Path to your messy test project
    examples_path = "./examples"
    
    console.clear()
    console.print(Panel.fit(
        "[bold cyan]DOCKER-OPTIMIZER: THE CI/CD DEV-TOOL SUITE[/bold cyan]\n"
        "[white]Act 1: Dockalyzer | Act 2: AutoStage | Act 3: HotDock[/white]",
        border_style="cyan"
    ))

    # --- ACT 1: DIAGNOSIS ---
    # We run the build and find out WHY it's slow.
    ana = Dockalyzer(path=examples_path)
    busted_line = ana.run()
    
    input("\n[Press ENTER to trigger Act 2: Auto-Optimization]...")

    # --- ACT 2: OPTIMIZATION ---
    # We take Act 1's findings, scan the codebase, and refactor.
    ref = AutoStage(target_dir=examples_path)
    ref.run(bust_info=busted_line)

    input("\n[Press ENTER to launch Act 3: Hot-Swap Development]...")

    # --- ACT 3: LIVE SYNC ---
    # We launch the optimized container and start the zero-build watcher.
    try:
        ref.launch_dev_mode()
    except KeyboardInterrupt:
        console.print("\n[bold red]Demo Ended.[/bold red]")

if __name__ == "__main__":
    if not os.path.exists("./examples/Dockerfile.messy"):
        console.print("[red]Error: Create ./examples/Dockerfile.messy to start the demo![/red]")
    else:
        run_hackathon_demo()