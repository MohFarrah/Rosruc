from optimizers import autostage, dockalyzer, hotdock


OPTIMIZERS = {
    "dockalyzer": dockalyzer.run,
    "autostage": autostage.run,
    "hotdock": hotdock.run,
}


def run_optimizer(mode: str, interval: str = "none", auto: bool = False) -> dict:
    optimizer = OPTIMIZERS.get(mode)
    if optimizer is None:
        raise ValueError(f"Unsupported optimizer mode: {mode}")

    return optimizer(interval=interval, auto=auto)
