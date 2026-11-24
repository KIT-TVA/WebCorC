"""Turns the models back into plain JSON-friendly structures."""

from __future__ import annotations

from dataclasses import fields, is_dataclass
from enum import Enum
from typing import Any

from .conditions import Condition


def to_dict(value: Any) -> Any:
    """Recursively convert models to dicts/lists/strings, dropping empty fields.

    :class:`~models.conditions.Condition` collapses to its text so the output
    reads as ``"precondition": "A.length > 0"``.
    """
    if isinstance(value, Condition):
        return value.condition
    if isinstance(value, Enum):
        return value.value
    if is_dataclass(value):
        result = {}
        for f in fields(value):
            converted = to_dict(getattr(value, f.name))
            if converted is None or converted == []:
                continue
            result[f.name] = converted
        return result
    if isinstance(value, (list, tuple)):
        return [to_dict(item) for item in value]
    return value
