"""The contract a statement is handed by the statement above it.

A refinement tree hands every statement its pre- and postcondition: a statement
does not choose them, the slot it fills does.  Reading the tree downwards gives
each statement the contract it is supposed to carry::

    ROOT           the root's own contract
    COMPOSITION    {pre} first {intermediate}  and  {intermediate} second {post}
    SELECTION      {pre && guard_i} command_i {post}
    REPETITION     {invariant && guard} body {invariant}

Conditions the parent does not have are handed down as ``None``: nothing is
invented here, only passed on.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Iterator, Optional, Tuple

from models import (
    Composition,
    Condition,
    Diagram,
    Repetition,
    Root,
    Selection,
    Statement,
)

from . import conditions

ROOT = "the root above it"
FIRST = "the composition above it, as its first statement"
SECOND = "the composition above it, as its second statement"
BODY = "the loop above it, as its body"
BRANCH = "the selection above it, as one of its branches"


@dataclass(frozen=True)
class Contract:
    """The pre- and postcondition a slot demands, and which slot demands them."""

    precondition: Optional[Condition]
    postcondition: Optional[Condition]
    source: str

    def condition(self, field: str) -> Optional[Condition]:
        """The contract's ``precondition`` or ``postcondition`` by name."""
        return getattr(self, field)


def contracts(diagram: Diagram) -> Dict[int, Contract]:
    """Maps ``id(statement)`` to the contract handed to it; the root is not in it."""
    handed: Dict[int, Contract] = {}
    if diagram.root is None:
        return handed
    for statement in diagram.root.walk():
        for child, contract in _handed(statement):
            handed[id(child)] = contract
    return handed


def _handed(statement: Statement) -> Iterator[Tuple[Statement, Contract]]:
    """What *statement* hands to each of the statements directly below it."""
    if isinstance(statement, Root):
        if statement.statement is not None:
            yield statement.statement, Contract(
                statement.precondition, statement.postcondition, ROOT
            )
    elif isinstance(statement, Composition):
        if statement.first_statement is not None:
            yield statement.first_statement, Contract(
                statement.precondition, statement.intermediate_condition, FIRST
            )
        if statement.second_statement is not None:
            yield statement.second_statement, Contract(
                statement.intermediate_condition, statement.postcondition, SECOND
            )
    elif isinstance(statement, Repetition):
        if statement.loop_statement is not None:
            yield statement.loop_statement, Contract(
                _both(statement.invariant, statement.guard), statement.invariant, BODY
            )
    elif isinstance(statement, Selection):
        for guard, command in zip(statement.guards, statement.commands):
            yield command, Contract(
                _both(statement.precondition, guard), statement.postcondition, BRANCH
            )


def _both(
    first: Optional[Condition], second: Optional[Condition]
) -> Optional[Condition]:
    """``first && second`` -- or whichever of the two the parent has."""
    if first is None or second is None:
        return first if second is None else second
    return Condition(f"{conditions.grouped(first)} {conditions.AND} {second}")
