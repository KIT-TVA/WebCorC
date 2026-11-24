"""Statement models -- one class per statement ``type`` found in a CorC diagram."""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Iterator, List, Optional

from .conditions import Condition
from .position import Position


class StatementType(str, Enum):
    """The ``type`` discriminator of a statement node."""

    ROOT = "ROOT"
    STATEMENT = "STATEMENT"
    SKIP = "SKIP"
    COMPOSITION = "COMPOSITION"
    REPETITION = "REPETITION"
    SELECTION = "SELECTION"


@dataclass
class Statement:
    """Base of every statement: the data every node carries."""

    type: StatementType
    precondition: Optional[Condition] = None
    postcondition: Optional[Condition] = None
    name: Optional[str] = None
    id: Optional[str] = None
    position: Optional[Position] = None

    @property
    def children(self) -> List["Statement"]:
        """Directly nested statements, in diagram order."""
        return []

    def walk(self) -> Iterator["Statement"]:
        """Yield this statement and every nested statement, depth first."""
        yield self
        for child in self.children:
            yield from child.walk()


@dataclass
class Root(Statement):
    """``ROOT`` -- the statement written directly in the diagram's ``content``.

    It has no ``type`` of its own in the JSON: it is the contract of the whole
    diagram, wrapping the single statement that has to fulfil it.
    """

    type: StatementType = StatementType.ROOT
    statement: Optional[Statement] = None

    @property
    def children(self) -> List[Statement]:
        return [self.statement] if self.statement is not None else []


@dataclass
class ProgramStatement(Statement):
    """``STATEMENT`` -- a leaf holding concrete Java code."""

    type: StatementType = StatementType.STATEMENT
    program_statement: Optional[str] = None


@dataclass
class Skip(Statement):
    """``SKIP`` -- a leaf that does nothing."""

    type: StatementType = StatementType.SKIP


@dataclass
class Composition(Statement):
    """``COMPOSITION`` -- two statements joined by an intermediate condition."""

    type: StatementType = StatementType.COMPOSITION
    intermediate_condition: Optional[Condition] = None
    first_statement: Optional[Statement] = None
    second_statement: Optional[Statement] = None

    @property
    def children(self) -> List[Statement]:
        return [s for s in (self.first_statement, self.second_statement) if s is not None]


@dataclass
class Repetition(Statement):
    """``REPETITION`` -- a loop with variant, invariant and guard."""

    type: StatementType = StatementType.REPETITION
    variant: Optional[Condition] = None
    invariant: Optional[Condition] = None
    guard: Optional[Condition] = None
    loop_statement: Optional[Statement] = None

    @property
    def children(self) -> List[Statement]:
        return [self.loop_statement] if self.loop_statement is not None else []


@dataclass
class Selection(Statement):
    """``SELECTION`` -- guarded alternatives; guard *i* belongs to command *i*."""

    type: StatementType = StatementType.SELECTION
    guards: List[Condition] = field(default_factory=list)
    commands: List[Statement] = field(default_factory=list)

    @property
    def children(self) -> List[Statement]:
        return list(self.commands)
