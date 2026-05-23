import os
import re

def scan_codebase(directory):
    """
    Scans the directory for Python imports or Node.js requires
    to see what libraries are actually used.
    """
    used_libs = set()
    
    # Regex for Python imports
    py_import_re = re.compile(r"^(?:from|import)\s+([a-zA-Z0-9_]+)")
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                with open(os.path.join(root, file), "r", errors='ignore') as f:
                    for line in f:
                        match = py_import_re.match(line)
                        if match:
                            used_libs.add(match.group(1))
            
            # Add Node.js support for the demo if needed
            elif file.endswith((".js", ".ts")):
                # Simple regex for require/import
                with open(os.path.join(root, file), "r", errors='ignore') as f:
                    content = f.read()
                    matches = re.findall(r"(?:import|require)\s*\(?['\"]([@a-zA-Z0-9/_-]+)", content)
                    for m in matches:
                        used_libs.add(m.split('/')[0]) # Get base package name

    return list(used_libs)