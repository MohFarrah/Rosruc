from flask import Flask
import os

app = Flask(__name__)

@app.route('/')
def hello():
    return "<h1>🚀 Docker-Optimizer is LIVE!</h1><p>Try changing this text to see HotDock magic.</p>"

if __name__ == "__main__":
    # AI will refactor this to use a reloader like uvicorn or flask run
    app.run(host='0.0.0.0', port=5000)