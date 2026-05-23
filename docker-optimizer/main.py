import os
from rich.console import Console
from rich.panel import Panel
from dockalyzer.dockalyzer import Dockalyzer
from autostage.autostage import AutoStage

console = Console()

def run_full_suite():
    path = "./examples"
    
    console.clear()
    console.print(Panel.fit(
        "[bold cyan]DOCKER-OPTIMIZER SUITE[/bold cyan]\n"
        "[white]Emergency CLI Mode[/white]",
        border_style="cyan"
    ))

    # --- ACT 1 ---
    ana = Dockalyzer(path=path)
    busted_line = ana.run()
    
    input("\n[Act 1 Finished] Press Enter to run Act 2 (Optimize)...")

    # --- ACT 2 ---
    ref = AutoStage(target_dir=path)
    ref.run(bust_info=busted_line)

    input("\n[Act 2 Finished] Press Enter to start Act 3 (HotDock Watcher)...")

    # --- ACT 3 ---
    try:
        ref.launch_dev_mode()
    except KeyboardInterrupt:
        console.print("\n[bold red]Suite stopped.[/bold red]")

if __name__ == "__main__":
    run_full_suite()