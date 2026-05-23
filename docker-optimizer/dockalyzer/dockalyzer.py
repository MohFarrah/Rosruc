import json
import subprocess
import os
import sys
from rich.console import Console
from rich.table import Table
from rich.live import Live
from rich.panel import Panel
from .agent import get_ai_analysis

console = Console()

class Dockalyzer:
    def __init__(self, path=".", tag="dockalyzer-demo"):
        self.path = path
        self.tag = tag
        self.steps = {}
        self.cache_broken_at = None
        self.last_logs = "" # To give the AI more context

    def run(self):
        # We add --load to ensure the image is actually pulled into the local docker engine
        cmd = ["docker", "buildx", "build", self.path, "-t", self.tag, "--progress=rawjson", "--load"]
        
        console.print(Panel.fit(
            "[bold cyan]DOCKALYZER v1.0[/bold cyan]\n[dim]Analyzing Docker Layer Transitions...[/dim]",
            border_style="cyan"
        ))

        try:
            # Setting bufsize=1 and text=True for real-time line processing
            process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, bufsize=1)
            
            with Live(self.generate_display(), refresh_per_second=4) as live:
                for line in process.stderr:
                    if not line.strip(): continue
                    try:
                        data = json.loads(line)
                        
                        # BuildKit logs also come in 'logs' stream - useful for AI context
                        if "logs" in data:
                            for l in data["logs"]:
                                # Convert base64 log msg if necessary, but rawjson usually gives msg
                                msg = l.get("msg", "")
                                if msg: self.last_logs = msg 

                        if "vertexes" in data:
                            for v in data["vertexes"]:
                                digest = v["digest"]
                                name = v["name"]
                                is_cached = v.get("cached", False)
                                # We want to ignore the 'setup' noise
                                is_internal = any(x in name for x in ["internal", "exporting", "preparing", "waiting"])
                                
                                if not is_internal and self.cache_broken_at is None and not is_cached:
                                    # Logic: First non-cached user instruction is our 'Bust Point'
                                    if "DONE" not in name and "FROM" not in name:
                                        self.cache_broken_at = name
                                
                                self.steps[digest] = {
                                    "name": name,
                                    "cached": is_cached,
                                    "internal": is_internal,
                                    "completed": "completed" in v
                                }
                            live.update(self.generate_display())
                    except json.JSONDecodeError:
                        continue
            process.wait()
            self.show_final_report()
            
            # --- CRITICAL INTEGRATION PIECE ---
            # Returns the busted line so AutoStage knows what to fix.
            return self.cache_broken_at

        except Exception as e:
            console.print(f"[bold red]Execution Error:[/bold red] {e}")
            return None

    def generate_display(self):
        table = Table(show_header=True, header_style="bold magenta", expand=True)
        table.add_column("Layer Status", width=20)
        table.add_column("Instruction", ratio=1)

        # Sort items so they appear in a consistent order
        for digest in sorted(self.steps.keys()):
            info = self.steps[digest]
            if info['internal']: continue
            
            if info['cached']:
                status = "[bold green]● CACHED[/bold green]"
                name = f"[dim]{info['name']}[/dim]"
            elif self.cache_broken_at == info['name']:
                status = "[bold red]➔ CACHE BUSTED[/bold red]"
                name = f"[bold red]{info['name']}[/bold red] [blink]🚩[/blink]"
            else:
                status = "[bold blue]○ BUILDING[/bold blue]"
                name = info['name']
                
            table.add_row(status, name)
        return table

    def show_final_report(self):
        # Locate Dockerfile
        dockerfile_path = os.path.join(self.path, "Dockerfile")
        if not os.path.exists(dockerfile_path):
            dockerfile_path = "Dockerfile"
            
        try:
            with open(dockerfile_path, "r") as f:
                content = f.read()
        except:
            content = "Dockerfile content unavailable."

        if self.cache_broken_at:
            console.print(f"\n[bold red]💥 Cache busted at:[/bold red] [yellow]{self.cache_broken_at}[/yellow]")
            console.print("[bold yellow]🔍 AI Investigating Root Cause...[/bold yellow]")
            analysis = get_ai_analysis("busted", content, self.cache_broken_at)
            title, color = "BUST ANALYSIS & FIX", "red"
        else:
            console.print("\n[bold green]🌟 Build Perfect! All layers reused.[/bold green]")
            analysis = get_ai_analysis("success", content)
            title, color = "OPTIMIZATION REPORT", "green"

        console.print(Panel(analysis, title=f"[bold {color}]{title}[/bold {color}]", border_style=color, padding=(1, 2)))

if __name__ == "__main__":
    target = "./examples" if os.path.exists("./examples") else "."
    Dockalyzer(path=target).run()