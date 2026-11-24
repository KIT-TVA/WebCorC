"""Builds the mxGraph XML of a ``.drawio`` file from a parsed diagram.

One box per statement holding its annotated guarded command -- precondition,
command and postcondition on a line each -- and one edge per
refinement carrying the step's title -- ``S<sub>1</sub>: COMPOSITION`` -- as an
edge label beside the arrow.  Each box wears its step number in a small circle
in its top left corner.  Beside the root stand the diagram's two
declaration boxes, its variables and its global conditions.  All of them come
from :mod:`rendering.gcl_style`, whose HTML is exactly what draw.io expects in
a ``html=1`` cell.
"""

from __future__ import annotations

from typing import Dict, List, Optional
from xml.etree import ElementTree as ET

from models import Diagram, Statement
from rendering import gcl_style

from .layout import PAGE_HEIGHT, PAGE_WIDTH, Box, Layout, declaration_box, tree_layout

HOST = "cbc-diagram-to-draw.io"

#: Air between a box's left and right border and its text, in pixels.  Top and
#: bottom stay flush -- no ``spacing``, which would pad all four sides -- so a
#: box is only ever as tall as the text it holds.
PADDING = 8
SIDE_PADDING = f"spacingLeft={PADDING};spacingRight={PADDING};"

BOX_STYLE = f"rounded=1;whiteSpace=wrap;html=1;{SIDE_PADDING}"

#: How far the declaration list is pulled up from the box's top border, in
#: pixels.  Negative: draw.io leaves a gap above a top-aligned label, and the
#: heading is meant to sit flush against the border instead.
DECLARATION_TOP_PADDING = -6

#: The variables and the global conditions.  Square and shadowed, so they read
#: as notes on the diagram rather than as steps of it; a list, so read from the
#: top left.
DECLARATION_STYLE = (
    f"rounded=0;whiteSpace=wrap;html=1;shadow=1;align=left;verticalAlign=top;"
    f"spacingTop={DECLARATION_TOP_PADDING};{SIDE_PADDING}"
)

#: The two declaration boxes: heading, the diagram's entries, and their place
#: in the row right of the root.
DECLARATIONS = (
    ("Variables", "java_variables", 0),
    ("Global Conditions", "global_conditions", 1),
)

#: The step number, in a small circle inside the box's top left corner, so it
#: reads as a badge on the box rather than as part of its triple.  Only the
#: statement boxes carry one; the declaration boxes beside the root do not.
#:
#: ``resizeWidth`` and ``resizeHeight`` are draw.io's per-child opt-out of the
#: resize a parent hands down to its children: without them, dragging a box's
#: handle scales the badge along with it.  Together with the relative geometry
#: of :func:`_badge` the circle keeps its size and its corner whatever is done
#: to the box.
BADGE_STYLE = (
    "ellipse;whiteSpace=wrap;html=1;align=center;verticalAlign=middle;"
    "fillColor=#ffffff;strokeColor=#000000;fontSize=8;spacing=0;"
    "resizeWidth=0;resizeHeight=0;"
)

#: The badge's diameter, in pixels.  Small enough that a two-digit number
#: overflows it a little, which is fine.
BADGE_SIZE = 12

#: How far the badge sits from the box's top and left border, in pixels.
BADGE_INSET = 2

#: How far right of :data:`PADDING` the triple's *first* line starts, so that it
#: begins clear of the badge.  CSS ``text-indent`` indents the first line and
#: only the first line, and the browser inside draw.io re-applies it every time
#: it lays the label out: a box that is resized, retyped or re-wrapped by hand
#: keeps the indent, and it follows the text if the wrap point moves.
#:
#: CSS cannot ask whether the text wrapped at all, so a triple short enough for
#: one line is indented too.  Deciding that here instead would mean guessing the
#: wrap point at generation time, and the guess would go stale the moment the
#: box is touched in draw.io.
BADGE_INDENT = BADGE_INSET + BADGE_SIZE + BADGE_INSET - PADDING

#: The triple, indented past the badge.  A wrapper, because draw.io has no style
#: key for a first-line indent -- but its labels are HTML, and CSS does.
INDENTED = f'<div>{{value}}</div>' # f'<div style="text-indent:{BADGE_INDENT}px">{{value}}</div>'

#: What separates the triple's three parts inside a box.  A line break written
#: into the label itself, so the precondition, the command and the postcondition
#: always start their own line -- rather than running on and breaking wherever
#: the box happens to end.  Wrapping stays on: a part too long for the box still
#: wraps, only within its own line.
TRIPLE_SEPARATOR = "<br>"

EDGE_STYLE = (
    "edgeStyle=orthogonalEdgeStyle;rounded=1;html=1;"
    "exitX={exit_x};exitY=1;exitDx=0;exitDy=0;entryX=0.5;entryY=0;entryDx=0;entryDy=0;"
)

EDGE_LABEL_STYLE = (
    "edgeLabel;html=1;align=center;verticalAlign=middle;resizable=0;points=[];"
    "labelBackgroundColor=none;"
)

#: How far right of the arrow the title sits, in pixels.
LABEL_OFFSET = 60


def to_xml(diagram: Diagram) -> str:
    """The full contents of a ``.drawio`` file for *diagram*."""
    tree = ET.ElementTree(_mxfile(diagram))
    ET.indent(tree, space="  ")
    return ET.tostring(tree.getroot(), encoding="unicode")


def _mxfile(diagram: Diagram) -> ET.Element:
    name = diagram.name or "diagram"
    mxfile = ET.Element("mxfile", host=HOST, type="device")
    page = ET.SubElement(mxfile, "diagram", id=f"CbC-{name}", name=name)
    model = ET.SubElement(
        page,
        "mxGraphModel",
        {
            "dx": "1400",
            "dy": "900",
            "grid": "1",
            "gridSize": "10",
            "guides": "1",
            "tooltips": "1",
            "connect": "1",
            "arrows": "1",
            "fold": "1",
            "page": "1",
            "pageScale": "1",
            "pageWidth": str(PAGE_WIDTH),
            "pageHeight": str(PAGE_HEIGHT),
            "math": "0",
            "shadow": "0",
        },
    )
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", id="0")
    ET.SubElement(root, "mxCell", id="1", parent="0")

    steps, numbers = gcl_style.numbering(diagram)
    boxes = tree_layout(diagram)
    cell_ids = {id(statement): _cell_id(statement, numbers) for statement in steps}

    for statement in steps:
        _vertex(root, statement, cell_ids, numbers, boxes.get(id(statement)))
    _declarations(root, diagram)
    for statement in steps:
        children = statement.children
        for index, child in enumerate(children):
            _edge(
                root,
                cell_ids[id(statement)],
                cell_ids[id(child)],
                gcl_style.title(child, numbers),
                _exit_x(index, len(children)),
            )
    return mxfile


def _exit_x(index: int, count: int) -> float:
    """Where the arrow to child *index* leaves the parent's bottom edge.

    The exits share the edge evenly, left to right in refinement order: a lone
    arrow leaves at the middle, two leave at a third and two thirds, *n* leave
    at ``1/(n+1)``, ..., ``n/(n+1)``.
    """
    return round((index + 1) / (count + 1), 4)


def _declarations(root: ET.Element, diagram: Diagram) -> None:
    """The two boxes beside the root: the diagram's variables and conditions."""
    for heading, attribute, index in DECLARATIONS:
        entries = getattr(diagram, attribute)
        box = declaration_box(index, lines=len(entries) + 1)
        cell = ET.SubElement(
            root,
            "mxCell",
            {
                "id": heading.replace(" ", ""),
                "value": gcl_style.declarations(heading, entries),
                "style": DECLARATION_STYLE,
                "vertex": "1",
                "parent": "1",
            },
        )
        ET.SubElement(cell, "mxGeometry", _geometry(box))


def _vertex(
    root: ET.Element,
    statement: Statement,
    cell_ids: Dict[int, str],
    numbers: Dict[int, int],
    box: Optional[Box],
) -> None:
    box = box or Box(x=0, y=0)
    cell_id = cell_ids[id(statement)]
    cell = ET.SubElement(
        root,
        "mxCell",
        {
            "id": cell_id,
            "value": INDENTED.format(
                value=gcl_style.triple(statement, numbers, TRIPLE_SEPARATOR)
            ),
            "style": BOX_STYLE,
            "vertex": "1",
            "parent": "1",
        },
    )
    ET.SubElement(cell, "mxGeometry", _geometry(box))
    _badge(root, cell_id, numbers.get(id(statement), 0))


def _badge(root: ET.Element, cell_id: str, number: int) -> None:
    """The circled step number, a child of the box it sits on.

    The root refines nothing and is numbered ``0``; every other box carries the
    number it was named with in its parent -- the ``S<sub>n</sub>`` that this
    step spells out.  Being a child, the badge is placed relative to the box's
    top left corner and travels with it when the box is moved in draw.io.

    The geometry is *relative*: ``x``/``y`` are a fraction of the box -- ``0``,
    ``0`` is its top left corner -- and the ``offset`` is the inset from there
    in whole pixels.  draw.io scales a child's absolute geometry when the box is
    resized, which would grow the circle and drift it away from the corner; a
    relative one it leaves alone, so the badge stays :data:`BADGE_SIZE` across
    and :data:`BADGE_INSET` from both borders however the box is stretched.

    The triple starts clear of it: see :data:`BADGE_INDENT`.
    """
    cell = ET.SubElement(
        root,
        "mxCell",
        {
            "id": f"{cell_id}-badge",
            "value": str(number),
            "style": BADGE_STYLE,
            "vertex": "1",
            "connectable": "0",
            "parent": cell_id,
        },
    )
    geometry = ET.SubElement(
        cell,
        "mxGeometry",
        {
            "x": "0",
            "y": "0",
            "width": _number(BADGE_SIZE),
            "height": _number(BADGE_SIZE),
            "relative": "1",
            "as": "geometry",
        },
    )
    ET.SubElement(
        geometry,
        "mxPoint",
        {"x": _number(BADGE_INSET), "y": _number(BADGE_INSET), "as": "offset"},
    )


def _geometry(box: Box) -> Dict[str, str]:
    return {
        "x": _number(box.x),
        "y": _number(box.y),
        "width": _number(box.width),
        "height": _number(box.height),
        "as": "geometry",
    }


def _edge(
    root: ET.Element, source: str, target: str, title: str, exit_x: float
) -> None:
    edge_id = f"{source}-{target}"
    cell = ET.SubElement(
        root,
        "mxCell",
        {
            "id": edge_id,
            "style": EDGE_STYLE.format(exit_x=_number(exit_x)),
            "edge": "1",
            "parent": "1",
            "source": source,
            "target": target,
        },
    )
    ET.SubElement(cell, "mxGeometry", {"relative": "1", "as": "geometry"})
    _edge_label(root, edge_id, title)


def _edge_label(root: ET.Element, edge_id: str, title: str) -> None:
    """The step's title, riding on the arrow and offset to its right."""
    cell = ET.SubElement(
        root,
        "mxCell",
        {
            "id": f"{edge_id}-title",
            "value": title,
            "style": EDGE_LABEL_STYLE,
            "vertex": "1",
            "connectable": "0",
            "parent": edge_id,
        },
    )
    geometry = ET.SubElement(
        cell, "mxGeometry", {"x": "0", "relative": "1", "as": "geometry"}
    )
    ET.SubElement(geometry, "mxPoint", {"x": str(LABEL_OFFSET), "as": "offset"})


def _cell_id(statement: Statement, numbers: Dict[int, int]) -> str:
    """``S`` for the root, ``S1``, ``S2``, ... for its refinements."""
    number = numbers.get(id(statement))
    return "S" if number is None else f"S{number}"


def _number(value: float) -> str:
    """Whole pixels stay whole: ``420`` rather than ``420.0``."""
    return str(int(value)) if float(value).is_integer() else str(value)


__all__: List[str] = ["to_xml"]
