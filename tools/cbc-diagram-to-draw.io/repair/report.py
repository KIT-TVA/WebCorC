"""What a repair changed -- one :class:`Fix` per rewritten condition."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import List, Optional

from models import Condition, Statement

#: The flag that turns every repair off; named in the report.
FLAG = "--no-repair"

NOTHING = "(none)"


@dataclass(frozen=True)
class Fix:
    """One condition of one statement, as it was and as it now reads."""

    diagram: str
    statement: Statement
    field: str
    before: Optional[Condition]
    after: Optional[Condition]
    reason: str

    def lines(self) -> List[str]:
        return [
            f"  {self.diagram}: {self.statement.type.value} {self._name()} {self.field}",
            f"    was  {_text(self.before)}",
            f"    now  {_text(self.after)}",
            f"    why  {self.reason}",
        ]

    def _name(self) -> str:
        """``'Repetition'`` -- the statement's name, or its id, or nothing."""
        return f"'{self.statement.name or self.statement.id or '?'}'"


@dataclass
class Report:
    """Every fix of a run, in the order the repairs made them."""

    fixes: List[Fix] = field(default_factory=list)

    def __bool__(self) -> bool:
        return bool(self.fixes)

    def __len__(self) -> int:
        return len(self.fixes)

    def statements(self) -> int:
        """How many statements were touched -- a fix rewrites one condition."""
        return len({id(fix.statement) for fix in self.fixes})

    def text(self) -> str:
        """The whole report, ready to be printed; empty when nothing changed."""
        if not self.fixes:
            return ""
        lines = [
            f"repair: rewrote {_count(len(self), 'condition')}"
            f" in {_count(self.statements(), 'statement')}"
            f" -- re-run with {FLAG} to keep the diagram as it was exported."
        ]
        for fix in self.fixes:
            lines.extend(fix.lines())
        return "\n".join(lines)

    def __str__(self) -> str:
        return self.text()


def _count(number: int, noun: str) -> str:
    return f"{number} {noun}" if number == 1 else f"{number} {noun}s"


def _text(condition: Optional[Condition]) -> str:
    return NOTHING if condition is None else str(condition)
