"""Options every renderer receives; individual renderers use what applies."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class RenderOptions:
    """Knobs shared by the renderers."""

    indent: int = 2
