"""Places the statements of a diagram on the draw.io canvas.

WebCorC's own coordinates (kept in ``Statement.position``) are laid out for its
small canvas nodes -- barely 250px apart -- while a box here carries a whole
annotated guarded command.  So the boxes get a fresh tree layout: one row per
refinement level, leaves packed left to right, every parent left aligned with
its first child.  The root therefore sits in the top left corner, and each
refinement steps down and -- for the later children -- to the right.

The boxes keep a fixed size; long triples simply overflow them.  Nothing is ever
scaled to the page: a tree wider than A4 simply runs across several of them, and
the layout is meant to be rearranged by hand in draw.io afterwards.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List

from models import Diagram, Statement

BOX_WIDTH = 300
BOX_HEIGHT = 50
COLUMN_GAP = 20
ROW_GAP = 30

#: The page the boxes are written onto: A4, landscape, in draw.io pixels.
PAGE_WIDTH = 1169
PAGE_HEIGHT = 826

#: Where the drawing starts, measured from the top left corner of that page.
MARGIN = 40

#: One line of a declaration box -- its heading, or one entry.
LINE_HEIGHT = 20

#: A declaration box holds short entries, so it stays narrower than a statement
#: box -- and keeps its own width, rather than following :data:`BOX_WIDTH`.
DECLARATION_WIDTH = 240


@dataclass(frozen=True)
class Box:
    """Where one statement sits, in draw.io pixels."""

    x: float
    y: float
    width: float = BOX_WIDTH
    height: float = BOX_HEIGHT


#: Maps ``id(statement)`` to its box.
Layout = Dict[int, Box]


def tree_layout(diagram: Diagram) -> Layout:
    """Lay the refinement tree out top down and left aligned, without overlaps."""
    boxes: Layout = {}
    if diagram.root is None:
        return boxes
    _place(diagram.root, depth=0, cursor=[float(MARGIN)], boxes=boxes)
    return boxes


def declaration_box(index: int, lines: int) -> Box:
    """Where the *index*-th declaration box sits: the top row, after the root.

    Only the root occupies that row, so the boxes stand side by side to its
    right.  A box grows downwards with the number of *lines* it holds -- its
    heading plus one line per entry.
    """
    return Box(
        x=MARGIN + BOX_WIDTH + COLUMN_GAP + index * (DECLARATION_WIDTH + COLUMN_GAP),
        y=MARGIN,
        width=DECLARATION_WIDTH,
        height=max(BOX_HEIGHT, lines * LINE_HEIGHT),
    )


def _place(statement: Statement, depth: int, cursor: List[float], boxes: Layout) -> float:
    """Place *statement* and its children; return the statement's x.

    ``cursor`` is the next free x for a leaf, shared by the whole recursion.
    """
    children = statement.children
    if children:
        child_x = [_place(child, depth + 1, cursor, boxes) for child in children]
        x = min(child_x)
    else:
        x = cursor[0]
        cursor[0] += BOX_WIDTH + COLUMN_GAP

    boxes[id(statement)] = Box(x=x, y=MARGIN + depth * (BOX_HEIGHT + ROW_GAP))
    return x
