"""The canvas position a statement was drawn at in WebCorC."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Position:
    """``{"xinPx": 825, "yinPx": 1200}`` -- pixels, may be negative."""

    x: float = 0.0
    y: float = 0.0

    def __str__(self) -> str:
        return f"({self.x}, {self.y})"
