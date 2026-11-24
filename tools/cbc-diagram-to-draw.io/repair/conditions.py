"""Reading a condition as a conjunction, without parsing it.

Conditions are opaque strings, so the repairs compare them by their top-level
``&&`` operands: ``a && (b && c)`` is *two* conjuncts, the second one nested.
Neither whitespace nor wrapping parentheses distinguish two conjuncts --
``j>=i``, ``j >= i`` and ``(j >= i)`` are all the same one.

The split is for *comparing* conditions only.  A condition is never rebuilt
from its conjuncts: dropping a pair of parentheses can change what a JML
quantifier reaches over, so text that is kept is kept verbatim.
"""

from __future__ import annotations

from typing import List, Optional

from models import Condition

AND = "&&"


def conjuncts(condition: Optional[Condition]) -> List[str]:
    """The top-level ``&&`` operands of *condition*; nested ones stay whole."""
    if condition is None:
        return []
    text = unwrap(str(condition))
    parts: List[str] = []
    depth = start = index = 0
    while index < len(text):
        depth += (text[index] == "(") - (text[index] == ")")
        if depth == 0 and text.startswith(AND, index):
            parts.append(text[start:index])
            index += len(AND)
            start = index
            continue
        index += 1
    parts.append(text[start:])
    return [part for part in parts if part.strip()]


def same(left: List[str], right: List[str]) -> bool:
    """Whether two lists of conjuncts hold the same conditions, in any order."""
    return sorted(_key(part) for part in left) == sorted(_key(part) for part in right)


def grouped(condition: Condition) -> str:
    """*condition* as a conjunct something may follow.

    A JML binder reaches to the end of its condition, so ``\\forall int h; P``
    would swallow whatever is appended to it and has to be parenthesized
    first; anything already closed is left as it stands.
    """
    text = str(condition).strip()
    return f"({text})" if _binds(text) else text


def unwrap(text: str) -> str:
    """``(a && b)`` -> ``a && b``; ``(a) && (b)`` keeps its parentheses."""
    text = text.strip()
    while len(text) > 1 and text.startswith("(") and text.endswith(")") and _closed(text):
        text = text[1:-1].strip()
    return text


def _closed(text: str) -> bool:
    """Whether the opening ``(`` of *text* is the one its last ``)`` closes."""
    depth = 0
    for index, char in enumerate(text):
        depth += (char == "(") - (char == ")")
        if depth == 0:
            return index == len(text) - 1
    return False


def _binds(text: str) -> bool:
    """Whether *text* carries a top-level ``;`` -- the tail of a JML binder."""
    depth = 0
    for char in text:
        depth += (char == "(") - (char == ")")
        if depth == 0 and char == ";":
            return True
    return False


def _key(part: str) -> str:
    """The conjunct as it is compared: no wrapping parentheses, no whitespace."""
    return "".join(unwrap(part).split())
