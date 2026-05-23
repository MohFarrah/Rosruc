from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

TEMPLATES_DIR = Path(__file__).resolve().parents[1] / "templates"
env = Environment(
    loader=FileSystemLoader(TEMPLATES_DIR),
    autoescape=select_autoescape(enabled_extensions=(), default_for_string=False),
)


def render_plan_yaml(run_services: list[dict], skipped_services: list[dict], skip_reasons: dict[str, str]) -> str:
    template = env.get_template("optimized_ci.yml.j2")
    return template.render(
        run_services=run_services,
        skipped_services=skipped_services,
        skip_reasons=skip_reasons,
    )
