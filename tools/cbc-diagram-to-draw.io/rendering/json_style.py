"""``json`` style -- the parsed diagrams as normalized JSON."""

from __future__ import annotations

import json
from typing import Sequence

from models import Diagram, to_dict

from .options import RenderOptions


def render(diagrams: Sequence[Diagram], options: RenderOptions) -> str:
    """A single diagram renders as an object, several as an array."""
    payload = [to_dict(diagram) for diagram in diagrams]
    return json.dumps(payload if len(payload) != 1 else payload[0], indent=options.indent)
