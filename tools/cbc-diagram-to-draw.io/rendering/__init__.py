"""Rendering styles for parsed diagrams.

Add a style by writing a module with a ``render(diagrams, options)`` function
and registering it in :data:`RENDERERS`.
"""

from __future__ import annotations

from typing import Callable, Dict, Optional, Sequence

from models import Diagram

from . import gcl_style, json_style, text_style
from .options import RenderOptions

Renderer = Callable[[Sequence[Diagram], RenderOptions], str]

RENDERERS: Dict[str, Renderer] = {
    "text": text_style.render,
    "json": json_style.render,
    "gcl": gcl_style.render,
}

STYLES = tuple(RENDERERS)

DEFAULT_STYLE = "text"


class UnknownStyleError(ValueError):
    """Raised when a style name has no renderer."""


def render(
    diagrams: Sequence[Diagram],
    style: str = DEFAULT_STYLE,
    options: Optional[RenderOptions] = None,
) -> str:
    """Render *diagrams* in the given *style*."""
    try:
        renderer = RENDERERS[style]
    except KeyError:
        raise UnknownStyleError(
            f"unknown style '{style}', expected one of: {', '.join(STYLES)}"
        ) from None
    return renderer(diagrams, options or RenderOptions())


__all__ = [
    "RENDERERS",
    "STYLES",
    "DEFAULT_STYLE",
    "RenderOptions",
    "Renderer",
    "UnknownStyleError",
    "render",
]
