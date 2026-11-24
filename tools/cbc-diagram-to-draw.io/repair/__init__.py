"""Repairs of an exported diagram, run once it is parsed and before it is used.

A repair reads a diagram, rewrites what a CbC rule says is wrong and reports
every condition it touched -- so the output is never silently different from
the file it came from.  ``--no-repair`` skips all of them.

Add a repair by writing a module with a ``repair(diagram)`` function returning
its :class:`~repair.report.Fix` list, and registering it in :data:`REPAIRS`.

    >>> report = repair.apply(diagrams)
    >>> print(report.text())
"""

from __future__ import annotations

from typing import Callable, List, Sequence

from models import Diagram

from . import conditions, contracts, repetitions
from .report import FLAG, Fix, Report

Repair = Callable[[Diagram], List[Fix]]

#: Every repair, in the order they are applied.
REPAIRS: Sequence[Repair] = (repetitions.repair,)


def apply(diagrams: Sequence[Diagram]) -> Report:
    """Repair every diagram in place; return everything that was changed."""
    report = Report()
    for diagram in diagrams:
        for rule in REPAIRS:
            report.fixes.extend(rule(diagram))
    return report


__all__ = [
    "FLAG",
    "REPAIRS",
    "Fix",
    "Repair",
    "Report",
    "apply",
    "conditions",
    "contracts",
    "repetitions",
]
