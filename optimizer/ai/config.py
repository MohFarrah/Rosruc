from pathlib import Path

AI_ROOT = Path(__file__).resolve().parent
CACHE_DIR = AI_ROOT / "cache"
PROMPTS_DIR = AI_ROOT / "prompts"

INTENT_PARSER_MODEL = "gpt-4o-mini"
IMPACT_ANALYZER_MODEL = "gpt-4o"
PIPELINE_OPTIMIZER_MODEL = "gpt-4o"
EMBEDDING_MODEL = "text-embedding-3-small"

TEMPERATURE = 0.1
SEED = 42
REPLAY_DURATIONS = True
