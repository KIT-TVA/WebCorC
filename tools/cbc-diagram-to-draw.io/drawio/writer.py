"""Writes ``CbC_<name>.drawio`` files."""

from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, List, Union

from models import Diagram

from .document import to_xml

PREFIX = "CbC_"
SUFFIX = ".drawio"

#: Characters no file name may carry on Windows, plus whitespace.
UNSAFE = re.compile(r'[<>:"/\\|?*\s]+')


def file_name(diagram: Diagram) -> str:
    """``CbC_MaxElement.drawio`` -- the file name for *diagram*."""
    name = UNSAFE.sub("_", (diagram.name or "diagram").strip()).strip("_")
    return f"{PREFIX}{name or 'diagram'}{SUFFIX}"


def write(diagram: Diagram, directory: Union[str, Path] = ".") -> Path:
    """Write *diagram* into *directory*; return the path written."""
    directory = Path(directory)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / file_name(diagram)
    path.write_text(to_xml(diagram) + "\n", encoding="utf-8")
    return path


def write_all(
    diagrams: Iterable[Diagram], directory: Union[str, Path] = "."
) -> List[Path]:
    """Write every diagram; return the paths written, in order."""
    return [write(diagram, directory) for diagram in diagrams]
