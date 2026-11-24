"""``gcl`` style -- one annotated guarded command per statement, as HTML.

Each statement of the diagram becomes a numbered refinement step::

    S<sub>4</sub>: STATEMENT
        {A.length &gt; 0} i := 0; {A.length &gt; 0 ∧ i == 0}

The step is titled with the placeholder it refines: the body of a statement
names its children as ``S<sub>n</sub>``, and the step spelling that child out
carries the same label.  The root refines nothing and is simply ``S``.

Numbers are handed out level by level -- left to right, top to bottom -- so a
statement is always numbered before the statements it refines into.  Conditions
carry the mathematical symbols -- ``&&``, ``||``, ``\\forall`` and ``\\exists``
are written ``∧``, ``∨``, ``∀`` and ``∃``, the comparisons ``<=``, ``>=``,
``!=`` and ``==`` are written ``≤``, ``≥``, ``≠`` and ``=``, and an implication
``->`` or ``==>`` is written ``→`` or ``⇒``.  All text is HTML-escaped, so the
output can be dropped into an HTML context as is.
"""

from __future__ import annotations

import html
import re
from typing import Dict, List, Optional, Sequence, Tuple

from models import (
    Composition,
    Condition,
    Diagram,
    ProgramStatement,
    Repetition,
    Selection,
    Skip,
    Statement,
)

from .options import RenderOptions

INDENT = "    "
PLACEHOLDER = "<b>S</b>"
SKIP_TEXT = "<b>skip</b>"
#: The guarded command's arrow, ``if Guard → S``; also what an implication
#: written ``->`` inside a condition becomes.
ARROW = "→"

#: A lone ``=`` -- not part of ``==``, ``<=``, ``>=``, ``!=`` or ``:=``.
ASSIGNMENT = re.compile(r"(?<![=!<>:])=(?!=)")

#: A condition's operators and JML binders, as their mathematical symbols.
#:
#: The order is the point: the replacements run one after another over the same
#: text, so every spelling has to come before the shorter one it contains.
#: ``==>`` before ``==``, or JML's implication would be left as ``=>``; ``<=``
#: and ``>=`` before ``=``, and both before :func:`_escape` turns a leftover
#: ``<`` or ``>`` into an entity.
SYMBOLS = {
    "==>": "⇒",
    "<=": "≤",
    ">=": "≥",
    "!=": "≠",
    "==": "=",
    "->": ARROW,
    "&&": "∧",
    "||": "∨",
    "\\forall": "∀",
    "\\exists": "∃",
}

#: Maps ``id(statement)`` to its refinement number; the root is not in it.
Numbering = Dict[int, int]


def render(diagrams: Sequence[Diagram], options: RenderOptions) -> str:
    blocks: List[str] = []
    for diagram in diagrams:
        steps, numbers = numbering(diagram)
        for statement in steps:
            blocks.append(
                f"{title(statement, numbers)}\n{INDENT}{triple(statement, numbers)}"
            )
    return "\n\n".join(blocks)


def numbering(diagram: Diagram) -> Tuple[List[Statement], Numbering]:
    """The statements in refinement order, with the number each one carries."""
    steps = refinement_order(diagram)
    return steps, {
        id(statement): number for number, statement in enumerate(steps) if number
    }


def refinement_order(diagram: Diagram) -> List[Statement]:
    """The statements level by level: the root, then each level of children."""
    if diagram.root is None:
        return []
    order: List[Statement] = []
    level = [diagram.root]
    while level:
        order.extend(level)
        level = [child for statement in level for child in statement.children]
    return order


def declarations(heading: str, entries: Sequence[object]) -> str:
    """A heading over one line per entry -- the HTML of a declaration box."""
    lines = [f"<b>{heading}</b>"] + [
        _text(entry) if isinstance(entry, Condition) else _escape(str(entry))
        for entry in entries
    ]
    return "<br>".join(lines)


def title(statement: Statement, numbers: Numbering) -> str:
    """``S<sub>4</sub>: STATEMENT`` -- the step's heading."""
    return f"{_label(statement, numbers)}: {statement.type.value}"


def triple(statement: Statement, numbers: Numbering, separator: str = " ") -> str:
    """``{pre} i := 0; {post}`` -- the annotated guarded command.

    *separator* goes between the three parts: a space for running text, a line
    break for a caller that wants each part on a line of its own.
    """
    return separator.join(
        (
            _braces(statement.precondition),
            _body(statement, numbers),
            _braces(statement.postcondition),
        )
    )


def _label(statement: Optional[Statement], numbers: Numbering) -> str:
    """``S<sub>4</sub>`` -- or plain ``S`` for the root and for gaps."""
    if statement is None:
        return PLACEHOLDER
    number = numbers.get(id(statement))
    if number is None:
        return PLACEHOLDER
    return f"{PLACEHOLDER}<b><sub>{number}</sub></b>"


def _body(statement: Statement, numbers: Numbering) -> str:
    """The guarded-command form of *statement*, without its two conditions."""
    if isinstance(statement, Skip):
        return SKIP_TEXT
    if isinstance(statement, ProgramStatement):
        return f"<b>{_assignment(statement.program_statement)}</b>"
    if isinstance(statement, Composition):
        return (
            f"{_label(statement.first_statement, numbers)}"
            f" {_braces(statement.intermediate_condition)} "
            f"{_label(statement.second_statement, numbers)}"
        )
    if isinstance(statement, Selection):
        return _selection(statement, numbers)
    if isinstance(statement, Repetition):
        return (
            f"<b>do</b> [{_text(statement.invariant)}, {_text(statement.variant)}]"
            f" {_text(statement.guard)} {ARROW} {_label(statement.loop_statement, numbers)} <b>od</b>"
        )
    return " ".join(_label(child, numbers) for child in statement.children) or PLACEHOLDER


def _selection(statement: Selection, numbers: Numbering) -> str:
    """``if Guard1 -&gt; S<sub>9</sub> elif ... fi`` -- guard *i* with command *i*."""
    branches = []
    for index in range(max(len(statement.guards), len(statement.commands))):
        guard = statement.guards[index] if index < len(statement.guards) else None
        command = statement.commands[index] if index < len(statement.commands) else None
        keyword = "<b>if</b>" if index == 0 else "<b>elif</b>"
        branches.append(f"{keyword} {_text(guard)} {ARROW} {_label(command, numbers)}")
    if not branches:
        return "<b>if</b> <b>fi</b>"
    return f"{' '.join(branches)} <b>fi</b>"


def _assignment(program_statement: Optional[str]) -> str:
    """Java assignments become guarded-command ones: ``i = 0;`` -> ``i := 0;``."""
    if not program_statement:
        return PLACEHOLDER
    return _escape(ASSIGNMENT.sub(":=", program_statement))


def _braces(condition: Optional[Condition]) -> str:
    return "{" + _text(condition) + "}"


def _text(condition: Optional[Condition]) -> str:
    return "" if condition is None else _escape(_symbols(str(condition)))


def _symbols(condition: str) -> str:
    """``&&``, ``==`` and ``\\forall`` as ∧, = and ∀; negations stay as written."""
    for spelling, symbol in SYMBOLS.items():
        condition = condition.replace(spelling, symbol)
    return condition


def _escape(text: str) -> str:
    """``&``, ``<`` and ``>`` as HTML entities; quotes stay readable."""
    return html.escape(text, quote=False)
