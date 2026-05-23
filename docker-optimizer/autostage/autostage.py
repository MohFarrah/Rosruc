import os
import time
import subprocess
import json
import re
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn
from .agent import refactor_dockerfile

console = Console()

class AutoStage:
    def __init__(self, target_dir="./examples"):
        self.target_dir = target_dir
        self.old_file = os.path.join(target_dir, "Dockerfile.messy")
        self.new_file = os.path.join(target_dir, "Dockerfile.optimized")
        self.results_file = os.path.join(target_dir, "performance_manifest.json")
        self.stats = {}

    def scan_dependencies(self):
        """
        Scans the entire codebase folder for actual library usage.
        Supports Python and Node.js for the demo.
        """
        used = set()
        # Patterns for different languages
        py_re = re.compile(r"^(?:from|import)\s+([a-zA-Z0-9_]+)")
        js_re = re.compile(r"(?:import|require)\s*\(?['\"]([@a-zA-Z0-9/_-]+)")

        for root, dirs, files in os.walk(self.target_dir):
            # Skip hidden folders and venv to save time/noise
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'venv']
            
            for file in files:
                file_path = os.path.join(root, file)
                
                # Scan Python Files
                if file.endswith(".py"):
                    with open(file_path, "r", errors='ignore') as f:
                        for line in f:
                            m = py_re.match(line.strip())
                            if m: used.add(m.group(1))
                
                # Scan JavaScript/TypeScript Files
                elif file.endswith((".js", ".ts")):
                    with open(file_path, "r", errors='ignore') as f:
                        content = f.read()
                        matches = js_re.findall(content)
                        for m in matches:
                            # Get the base package name (e.g., 'express' from 'express/lib')
                            used.add(m.split('/')[0] if not m.startswith('@') else "/".join(m.split('/')[:2]))

        return list(used)

    def get_image_size(self, tag):
        try:
            cmd = ["docker", "inspect", "-f", "{{.Size}}", tag]
            res = subprocess.run(cmd, capture_output=True, text=True, check=True)
            return round(int(res.stdout.strip()) / (1024 * 1024), 2)
        except: return 0

    def parse_ai_response(self, text):
        try:
            bloat = text.split("REMOVED_BLOAT:")[1].split("EXPLANATION:")[0].strip()
            explanation = text.split("EXPLANATION:")[1].split("NEW_DOCKERFILE:")[0].strip()
            code_part = text.split("NEW_DOCKERFILE:")[1].split("ESTIMATED_SIZE:")[0]
            dockerfile = code_part.replace("```dockerfile", "").replace("```", "").strip()
            return bloat, explanation, dockerfile
        except:
            return "General bloat removed.", "Optimized for speed.", text

    def run(self, bust_info=None):
        console.print(Panel.fit(
            "[bold green]AutoStage: AI Tree-Shaker & Refactorer[/bold green]\n"
            "[dim]Integrating Codebase Analysis + Cache-Bust Context[/dim]", 
            border_style="green"
        ))

        # 1. Codebase Scan (Dependency Detection)
        with console.status("[bold magenta]Scanning codebase for actual imports...[/bold magenta]"):
            used_libs = self.scan_dependencies()
            console.print(f"[dim]Detected active dependencies: {', '.join(used_libs[:5])}...[/dim]")

        # 2. Load the Messy Dockerfile
        with open(self.old_file, "r") as f:
            old_content = f.read()

        # 3. AI Refactor (Passing in Used Libs + Bust Info from Idea 1)
        with console.status("[bold yellow]Gemini AI is pruning bloat and re-layering...[/bold yellow]"):
            raw_ai_response = refactor_dockerfile(old_content, used_libs, bust_info)
            bloat_report, explanation, optimized_code = self.parse_ai_response(raw_ai_response)

        # 4. Write the optimized file
        with open(self.new_file, "w") as f:
            f.write(optimized_code)

        console.print(Panel(bloat_report, title="[bold red]Bloat Radar (Tree-Shaking Results)[/bold red]", border_style="red"))
        console.print(Panel(explanation, title="[bold cyan]Architectural Optimization[/bold cyan]", border_style="cyan"))

        # 5. Performance Benchmark (The Proof)
        console.print("\n[bold cyan]Benchmarking: Measuring ROI...[/bold cyan]")
        with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"), BarColumn(), console=console) as progress:
            # Build Messy
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

if __name__ == "__main__":
    # Integration Demo: Pass a dummy 'bust' instruction as if it came from Idea 1
    AutoStage().run(bust_info="COPY . .")