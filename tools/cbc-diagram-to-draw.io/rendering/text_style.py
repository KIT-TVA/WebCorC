"""``text`` style -- the diagram as an indented tree."""

from __future__ import annotations

from typing import List, Optional, Sequence

from models import (
    Composition,
    Diagram,
    ProgramStatement,
    Repetition,
    Root,
    Selection,
    Statement,
)

from .options import RenderOptions

INDENT = "  "


def render(diagrams: Sequence[Diagram], options: RenderOptions) -> str:
    lines: List[str] = []
    for diagram in diagrams:
        if lines:
            lines.append("")
        lines.extend(_diagram_lines(diagram))
    return "\n".join(lines)


def _diagram_lines(diagram: Diagram) -> List[str]:
    lines = [f"Diagram: {diagram.name}"]

    lines.append(f"{INDENT}javaVariables:")
    for variable in diagram.java_variables:
        lines.append(f"{INDENT * 2}- {variable}")

    lines.append(f"{INDENT}globalConditions:")
    for condition in diagram.global_conditions:
        lines.append(f"{INDENT * 2}- {condition}")

    lines += _statement_lines(diagram.root, 1)
    return lines


def _statement_lines(statement: Optional[Statement], depth: int) -> List[str]:
    """Render a statement and everything nested inside it."""
    if statement is None:
        return [f"{INDENT * depth}(none)"]

    lines = [f"{INDENT * depth}[{statement.type.value}] {statement.name}"]
    lines += _field_lines("precondition", statement.precondition, depth + 1)
    lines += _field_lines("postcondition", statement.postcondition, depth + 1)

    if isinstance(statement, Root):
        lines.append(f"{INDENT * (depth + 1)}statement:")
        lines += _statement_lines(statement.statement, depth + 2)
    elif isinstance(statement, ProgramStatement):
        lines += _field_lines("programStatement", statement.program_statement, depth + 1)
    elif isinstance(statement, Composition):
        lines += _field_lines(
            "intermediateCondition", statement.intermediate_condition, depth + 1
        )
        lines.append(f"{INDENT * (depth + 1)}first:")
        lines += _statement_lines(statement.first_statement, depth + 2)
        lines.append(f"{INDENT * (depth + 1)}second:")
        lines += _statement_lines(statement.second_statement, depth + 2)
    elif isinstance(statement, Repetition):
        lines += _field_lines("variant", statement.variant, depth + 1)
        lines += _field_lines("invariant", statement.invariant, depth + 1)
        lines += _field_lines("guard", statement.guard, depth + 1)
        lines.append(f"{INDENT * (depth + 1)}loop:")
        lines += _statement_lines(statement.loop_statement, depth + 2)
    elif isinstance(statement, Selection):
        for index, command in enumerate(statement.commands):
            guard = statement.guards[index] if index < len(statement.guards) else None
            lines.append(f"{INDENT * (depth + 1)}guard: {guard}")
            lines += _statement_lines(command, depth + 2)

    return lines


def _field_lines(label: str, value: object, depth: int) -> List[str]:
    if value is None:
        return []
    return [f"{INDENT * depth}{label}: {value}"]
