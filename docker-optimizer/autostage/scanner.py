import os
import re

def scan_codebase(directory):
    """
    Scans the directory for Python imports or Node.js requires.
    Optimized to skip heavy library folders like venv and node_modules.
    """
    used_libs = set()
    
    # Improved Regex: Handles indentation and 'from x import y'
    py_import_re = re.compile(r"^\s*(?:from|import)\s+([a-zA-Z0-9_]+)")
    
    # Folders to absolutely ignore
    ignore_dirs = { 'venv', '.git', '__pycache__', 'node_modules', '.venv', 'dist', 'build' }

    for root, dirs, files in os.walk(directory):
        # Efficiency: This line tells os.walk to skip the ignored directories
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            file_path = os.path.join(root, file)
            try:
                if file.endswith(".py"):
                    with open(file_path, "r", errors='ignore') as f:
                        for line in f:
                            match = py_import_re.match(line)
                            if match:
                                used_libs.add(match.group(1))
                
                elif file.endswith((".js", ".ts")):
                    with open(file_path, "r", errors='ignore') as f:
                        content = f.read()
                        # Matches: import { x } from 'lib' OR const x = require('lib')
                        matches = re.findall(r"(?:import|require)\s*\(?['\"]([@a-zA-Z0-9/_-]+)", content)
                        for m in matches:
                            # Handle scoped packages like @org/package
                            parts = m.split('/')
                            used_libs.add(parts[0] if not m.startswith('@') else f"{parts[0]}/{parts[1]}")
            except Exception:
                continue # Skip files that can't be read

    return list(used_libs)