from dataclasses import asdict, dataclass, field


@dataclass
class RunResult:
    status: str
    mode: str
    interval: str
    auto: bool
    beforeTime: str
    afterTime: str
    summary: str
    recommendation: str
    details: dict
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)
