"""Loops that carry the wrong contract.

A statement's pre- and postcondition belong to the slot it fills, not to the
statement itself: whatever is above a loop in the refinement tree is what says
where the loop starts and where it has to end.  The invariant and the guard say
how the loop gets there -- they are its *proof obligation*, ``pre => I`` and
``I && !G => post``, not its contract.

WebCorC exports loops carrying the contract of their own body instead, the one
the loop hands *down*::

    {maxe(A,0,j,i) && j != A.length}                       <- I && G, the body's
    do [maxe(A,0,j,i), A.length - j] j != A.length -> S od
    {maxe(A,0,j,i)}                                        <- I, the body's

Both are replaced by what the statement above hands the loop -- for the loop
above, the intermediate condition and postcondition of its composition::

    {A.length > 0 && i == 0 && j == 1} do [...] od {maxe(A, 0, A.length, i)}

A loop whose contract the parent has no condition for keeps the one it has:
nothing is invented, and a loop that already agrees with its parent is left
untouched.
"""

from __future__ import annotations

from typing import List, Optional

from models import Condition, Diagram, Repetition

from . import conditions, contracts
from .report import Fix

FIELDS = ("precondition", "postcondition")


def repair(diagram: Diagram) -> List[Fix]:
    """Give every repetition of *diagram* its parent's contract; report changes."""
    handed = contracts.contracts(diagram)
    fixes: List[Fix] = []
    for statement in diagram.walk():
        if not isinstance(statement, Repetition):
            continue
        contract = handed.get(id(statement))
        if contract is not None:
            fixes.extend(_align(statement, contract, diagram.name))
    return fixes


def _align(
    repetition: Repetition, contract: contracts.Contract, diagram: str
) -> List[Fix]:
    """Rewrite the conditions of *repetition* that its contract disagrees with."""
    fixes = []
    for field in FIELDS:
        fix = _condition(repetition, contract, field, diagram)
        if fix is not None:
            fixes.append(fix)
    return fixes


def _condition(
    repetition: Repetition, contract: contracts.Contract, field: str, diagram: str
) -> Optional[Fix]:
    intended = contract.condition(field)
    if intended is None or _agree(getattr(repetition, field), intended):
        return None
    fix = Fix(
        diagram=diagram,
        statement=repetition,
        field=field,
        before=getattr(repetition, field),
        after=intended,
        reason=f"handed down by {contract.source}",
    )
    setattr(repetition, field, intended)
    return fix


def _agree(current: Optional[Condition], intended: Condition) -> bool:
    """Whether the loop already carries *intended*, however it is written."""
    if current is None:
        return False
    return conditions.same(
        conditions.conjuncts(current), conditions.conjuncts(intended)
    )
