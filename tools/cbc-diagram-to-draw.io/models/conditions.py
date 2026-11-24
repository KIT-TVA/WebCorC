"""Small value objects shared by all statement models."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Condition:
    """A single first-order condition, e.g. ``{"condition": "A.length > 0"}``."""

    condition: str

    def __str__(self) -> str:
        return self.condition


@dataclass(frozen=True)
class JavaVariable:
    """An entry of the diagram's ``javaVariables`` list, e.g. ``int[] A`` / ``LOCAL``."""

    name: str
    kind: str

    def __str__(self) -> str:
        return f"{self.name} ({self.kind})"
