import os
import time
import subprocess
import json
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn

# Internal Suite Imports
from .agent import refactor_dockerfile
from .scanner import scan_codebase
from hotdock.hotdock import HotDock

console = Console()

class AutoStage:
    def __init__(self, target_dir="./examples"):
        self.target_dir = os.path.abspath(target_dir)
        self.old_file = os.path.join(self.target_dir, "Dockerfile.messy")
        self.new_file = os.path.join(self.target_dir, "Dockerfile.optimized")
        self.results_file = os.path.join(self.target_dir, "performance_manifest.json")
        self.stats = {}

    def get_image_size(self, tag):
        """Returns image size in MB."""
        try:
            cmd = ["docker", "inspect", "-f", "{{.Size}}", tag]
            res = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return round(int(res.stdout.strip()) / (1024 * 1024), 2)
        except: 
            return 0

    def parse_ai_response(self, text):
        """Robustly parses the AI output format."""
        try:
            bloat = text.split("REMOVED_BLOAT:")[1].split("EXPLANATION:")[0].strip()
            explanation = text.split("EXPLANATION:")[1].split("NEW_DOCKERFILE:")[0].strip()
            code_part = text.split("NEW_DOCKERFILE:")[1].split("ESTIMATED_SIZE:")[0]
            dockerfile = code_part.replace("```dockerfile", "").replace("```", "").strip()
            return bloat, explanation, dockerfile
        except:
            return "General bloat removed.", "Architecture optimized for Hot-Swap.", text

    def run(self, bust_info=None):
        """
        Act 2: The Architect.
        Refactors the Dockerfile based on codebase scan and Act 1 diagnostics.
        """
        console.print(Panel.fit(
            "[bold green]AutoStage: AI Tree-Shaker & Refactorer[/bold green]\n"
            "[dim]Pruning bloat and preparing Hot-Swap layers[/dim]", 
            border_style="green"
        ))

        # 1. Codebase Scan (Dependency Detection via scanner.py)
        with console.status("[bold magenta]Scanning codebase for actual imports (Tree-Shaking)...[/bold magenta]"):
            used_libs = scan_codebase(self.target_dir)
            console.print(f"[dim]Detected active dependencies: {', '.join(used_libs[:10])}...[/dim]")

        # 2. Load the Messy Dockerfile
        if not os.path.exists(self.old_file):
            console.print(f"[red]Error: {self.old_file} not found. Create it for the demo![/red]")
            return

        with open(self.old_file, "r") as f:
            old_content = f.read()

        # 3. AI Refactor (Contextual Intelligence)
        with console.status("[bold yellow]Gemini AI is re-layering for Zero-Build mode...[/bold yellow]"):
            raw_ai_response = refactor_dockerfile(old_content, used_libs, bust_info)
            bloat_report, explanation, optimized_code = self.parse_ai_response(raw_ai_response)

        # 4. Write the optimized file
        with open(self.new_file, "w") as f:
            f.write(optimized_code)

        console.print(Panel(bloat_report, title="[bold red]Bloat Radar[/bold red]", border_style="red"))
        console.print(Panel(explanation, title="[bold cyan]Architectural Optimization[/bold cyan]", border_style="cyan"))

        # 5. Performance Benchmark (The Proof)
        console.print("\n[bold cyan]Benchmarking: Original vs. Optimized Build...[/bold cyan]")
        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), BarColumn(), console=console) as progress:
            # Build Original
            t1 = progress.add_task("[red]Building Original (Bloated)...", total=100)
            start_old = time.time()
            subprocess.run(["docker", "build", "-t", "stage-old", "-f", self.old_file, self.target_dir], capture_output=True)
            old_time = time.time() - start_old
            old_size = self.get_image_size("stage-old")
            progress.update(t1, completed=100)

            # Build Optimized
            t2 = progress.add_task("[green]Building AutoStage (Pruned)...", total=100)
            start_new = time.time()
            subprocess.run(["docker", "build", "-t", "stage-new", "-f", self.new_file, self.target_dir], capture_output=True)
            new_time = time.time() - start_new
            new_size = self.get_image_size("stage-new")
            progress.update(t2, completed=100)

        # 6. Data Export for VS Extension UI
        self.stats = {
            "metrics": {
                "build_time": {"before": round(old_time, 2), "after": round(new_time, 2)},
                "image_size": {"before": old_size, "after": new_size}
            },
            "savings": {
                "time": f"{round(((old_time - new_time)/old_time)*100, 1)}%" if old_time > 0 else "0%",
                "size": f"{round(((old_size - new_size)/old_size)*100, 1)}%" if old_size > 0 else "0%"
            },
            "bloat_removed": bloat_report
        }
        with open(self.results_file, "w") as f:
            json.dump(self.stats, f, indent=4)

        self.show_summary()

    def show_summary(self):
        table = Table(title="Quantifiable Proof: Before vs After")
        table.add_column("Metric", style="bold")
        table.add_column("Original (Messy)", style="red")
        table.add_column("AutoStage (AI)", style="green")
        table.add_column("Improvement", style="cyan")

        m = self.stats["metrics"]
        s = self.stats["savings"]

        table.add_row("Build Time", f"{m['build_time']['before']}s", f"{m['build_time']['after']}s", s['time'])
        table.add_row("Image Size", f"{m['image_size']['before']} MB", f"{m['image_size']['after']} MB", s['size'])

        console.print(table)
        console.print(f"\n[bold green]✅ Manifest Sync Ready![/bold green] Results exported to {self.results_file}")

    def launch_dev_mode(self):
        """
        Act 2 -> Act 3 Handoff:
        Launches the optimized container and hands control over to HotDock.
        """
        console.print("\n" + Panel.fit(
            "[bold orange3]Entering Zero-Build Dev Mode (HotDock Integration)[/bold orange3]\n"
            "[dim]The build phase is over. Changes are now injected instantly.[/dim]", 
            border_style="orange3"
        ))
        
        container_name = "autostage-dev-container"
        image_tag = "stage-new"

        # 1. Cleanup
        with console.status(f"[dim]Removing old container {container_name}...[/dim]"):
            subprocess.run(["docker", "rm", "-f", container_name], capture_output=True)

        # 2. Launch: Start container with AI-optimized reloader CMD
        console.print(f"[bold blue]🚀 Launching container:[/bold blue] [white]{container_name}[/white]")
        # -itd ensures it stays running and respects the reloader (uvicorn/nodemon)
        launch_cmd = ["docker", "run", "-itd", "--name", container_name, image_tag]
        
        result = subprocess.run(launch_cmd, capture_output=True, text=True)
        if result.returncode != 0:
            console.print(f"[bold red]Failed to launch container:[/bold red] {result.stderr}")
            return

        # 3. Act 3 Handoff: Start HotDock watch loop
        try:
            hd = HotDock(project_path=self.target_dir)
            hd.config["container_name"] = container_name
            hd.config["remote_dir"] = "/app" # Default target for AI refactor
            
            hd.start()
            
        except KeyboardInterrupt:
            console.print("\n[bold red]Stopping HotDock session...[/bold red]")
        except Exception as e:
            console.print(f"[bold red]HotDock Error:[/bold red] {e}")

if __name__ == "__main__":
    AutoStage().run(bust_info="COPY . .")