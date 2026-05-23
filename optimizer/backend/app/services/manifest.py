import json
from functools import lru_cache
from pathlib import Path

from app.config import SERVICE_GRAPH_PATH


@lru_cache
def load_service_graph() -> list[dict]:
    if not SERVICE_GRAPH_PATH.exists():
        return []
    payload = json.loads(SERVICE_GRAPH_PATH.read_text(encoding="utf-8"))
    return payload.get("services", payload if isinstance(payload, list) else [])


def all_services() -> list[dict]:
    return load_service_graph()


def get_service(name: str) -> dict | None:
    return next((service for service in all_services() if service["name"] == name), None)


def services_for_paths(paths: list[str]) -> list[dict]:
    matched: list[dict] = []
    for service in all_services():
        for owned_path in service.get("paths", []):
            if any(path.startswith(owned_path) for path in paths):
                matched.append(service)
                break
    return matched


def dependents_of(service_name: str) -> list[str]:
    service = get_service(service_name)
    if not service:
        return []
    return list(service.get("consumed_by", []))
