"""The diagram model -- the file-level declarations around the root statement."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Iterator, List, Optional

from .conditions import Condition, JavaVariable
from .statements import Root, Statement


@dataclass
class Diagram:
    """A CorC diagram: its declarations plus the :class:`Root` statement."""

    name: Optional[str] = None
    java_variables: List[JavaVariable] = field(default_factory=list)
    global_conditions: List[Condition] = field(default_factory=list)
    root: Optional[Root] = None
    urn: Optional[str] = None

    @property
    def precondition(self) -> Optional[Condition]:
        """The diagram's precondition -- the one of its root statement."""
        return self.root.precondition if self.root else None

    @property
    def postcondition(self) -> Optional[Condition]:
        """The diagram's postcondition -- the one of its root statement."""
        return self.root.postcondition if self.root else None

    @property
    def statement(self) -> Optional[Statement]:
        """The statement nested in the root statement."""
        return self.root.statement if self.root else None

    def walk(self) -> Iterator[Statement]:
        """Yield every statement of the diagram, depth first, root first."""
        if self.root is not None:
            yield from self.root.walk()
