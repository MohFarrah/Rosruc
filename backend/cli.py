import argparse
import json
import sys


VALID_MODES = ("dockalyzer", "autostage", "hotdock")


class JsonArgumentParser(argparse.ArgumentParser):
    def error(self, message: str) -> None:
        raise ValueError(message)


def parse_bool(value: str) -> bool:
    normalized = value.strip().lower()
    if normalized == "true":
        return True
    if normalized == "false":
        return False
    raise argparse.ArgumentTypeError("--auto must be true or false")


def build_parser() -> argparse.ArgumentParser:
    parser = JsonArgumentParser(
        description="Docker Dev Optimizer backend CLI for VS Code.",
        add_help=False,
    )
    parser.add_argument("--mode", choices=VALID_MODES, required=True)
    parser.add_argument("--interval", default="none")
    parser.add_argument("--auto", type=parse_bool, default=False)
    return parser


def main() -> int:
    try:
        from core.dispatcher import run_optimizer
        from db import save_successful_run

        args = build_parser().parse_args()
        result = run_optimizer(
            mode=args.mode,
            interval=args.interval,
            auto=args.auto,
        )

        if result.get("status") == "success":
            warning = save_successful_run(result)
            if warning:
                result.setdefault("warnings", []).append(warning)

    except Exception as error:
        result = {
            "status": "error",
            "error": str(error),
        }

    print(json.dumps(result, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
