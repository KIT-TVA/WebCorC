"""Extracts :mod:`models` objects from the JSON export of a CorC diagram.

The export is a directory tree: nested ``content`` lists whose leaves are files.
A file with ``"type": "diagram"`` holds the diagram itself in its ``content``.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterator, List, Optional, Union

from models import (
    Composition,
    Condition,
    Diagram,
    JavaVariable,
    Position,
    ProgramStatement,
    Repetition,
    Root,
    Selection,
    Skip,
    Statement,
    StatementType,
)

DIAGRAM_NODE_TYPE = "diagram"


class CbcParseError(ValueError):
    """Raised when the JSON does not have the shape of a CorC export."""


class CbcJsonParser:
    """Turns raw CorC JSON into :class:`~models.diagram.Diagram` objects."""

    def parse_file(self, path: Union[str, Path]) -> Diagram:
        """Parse the first diagram of the file at *path*."""
        return self._first(self.parse_file_all(path), f"file '{path}'")

    def parse_file_all(self, path: Union[str, Path]) -> List[Diagram]:
        """Parse every diagram contained in the file at *path*."""
        path = Path(path)
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise CbcParseError(f"'{path}' is not valid JSON: {exc}") from exc
        return self.parse(raw)

    def parse_string(self, text: str) -> Diagram:
        """Parse the first diagram of the JSON document *text*."""
        try:
            raw = json.loads(text)
        except json.JSONDecodeError as exc:
            raise CbcParseError(f"not valid JSON: {exc}") from exc
        return self._first(self.parse(raw), "input")

    def parse(self, raw: Any) -> List[Diagram]:
        """Parse every diagram of an already decoded JSON document."""
        return [self.parse_diagram_node(node) for node in self._find_diagram_nodes(raw)]

    # -- diagram ---------------------------------------------------------

    def parse_diagram_node(self, node: Dict[str, Any]) -> Diagram:
        """Parse a file node whose ``type`` is ``diagram``."""
        content = node.get("content")
        if not isinstance(content, dict):
            raise CbcParseError("diagram node has no object 'content'")
        return self.parse_diagram(content, urn=node.get("urn"))

    def parse_diagram(
        self, content: Dict[str, Any], urn: Optional[str] = None
    ) -> Diagram:
        """Parse the ``content`` object of a diagram file node."""
        return Diagram(
            name=content.get("name"),
            java_variables=self._java_variables(content.get("javaVariables")),
            global_conditions=self._conditions(content.get("globalConditions")),
            root=self.parse_root(content),
            urn=urn,
        )

    def parse_root(self, content: Dict[str, Any]) -> Root:
        """Parse the root statement, which is the ``content`` object itself."""
        return Root(
            precondition=self._condition(content.get("preCondition")),
            postcondition=self._condition(content.get("postCondition")),
            name=content.get("name"),
            position=self._position(content.get("position")),
            statement=self.parse_statement(content.get("statement")),
        )

    # -- statements ------------------------------------------------------

    def parse_statement(self, node: Optional[Dict[str, Any]]) -> Optional[Statement]:
        """Parse a statement node, dispatching on its ``type``."""
        if node is None:
            return None
        if not isinstance(node, dict):
            raise CbcParseError(f"expected a statement object, got {type(node).__name__}")

        raw_type = node.get("type")
        try:
            statement_type = StatementType(raw_type)
        except ValueError:
            raise CbcParseError(f"unknown statement type '{raw_type}'") from None

        builders = {
            StatementType.STATEMENT: self._program_statement,
            StatementType.SKIP: self._skip,
            StatementType.COMPOSITION: self._composition,
            StatementType.REPETITION: self._repetition,
            StatementType.SELECTION: self._selection,
        }
        builder = builders.get(statement_type)
        if builder is None:
            # ROOT exists only as the diagram's content, never as a nested node.
            raise CbcParseError(f"statement type '{raw_type}' cannot be nested")
        return builder(node)

    def _common(self, node: Dict[str, Any]) -> Dict[str, Any]:
        """The fields every statement carries, ready to splat into a model."""
        return {
            "precondition": self._condition(node.get("preCondition")),
            "postcondition": self._condition(node.get("postCondition")),
            "name": node.get("name"),
            "id": node.get("id"),
            "position": self._position(node.get("position")),
        }

    def _program_statement(self, node: Dict[str, Any]) -> ProgramStatement:
        return ProgramStatement(
            **self._common(node),
            program_statement=node.get("programStatement"),
        )

    def _skip(self, node: Dict[str, Any]) -> Skip:
        return Skip(**self._common(node))

    def _composition(self, node: Dict[str, Any]) -> Composition:
        return Composition(
            **self._common(node),
            intermediate_condition=self._condition(node.get("intermediateCondition")),
            first_statement=self.parse_statement(node.get("firstStatement")),
            second_statement=self.parse_statement(node.get("secondStatement")),
        )

    def _repetition(self, node: Dict[str, Any]) -> Repetition:
        return Repetition(
            **self._common(node),
            variant=self._condition(node.get("variant")),
            invariant=self._condition(node.get("invariant")),
            guard=self._condition(node.get("guard")),
            loop_statement=self.parse_statement(node.get("loopStatement")),
        )

    def _selection(self, node: Dict[str, Any]) -> Selection:
        return Selection(
            **self._common(node),
            guards=self._conditions(node.get("guards")),
            commands=[
                statement
                for statement in (
                    self.parse_statement(command) for command in node.get("commands") or []
                )
                if statement is not None
            ],
        )

    # -- leaves ----------------------------------------------------------

    @staticmethod
    def _condition(node: Any) -> Optional[Condition]:
        """``{"condition": "..."}`` -> :class:`~models.conditions.Condition`."""
        if node is None:
            return None
        if isinstance(node, str):
            return Condition(node)
        if isinstance(node, dict):
            return Condition(node.get("condition", ""))
        raise CbcParseError(f"expected a condition, got {type(node).__name__}")

    @classmethod
    def _conditions(cls, nodes: Any) -> List[Condition]:
        conditions = (cls._condition(node) for node in nodes or [])
        return [condition for condition in conditions if condition is not None]

    @staticmethod
    def _position(node: Any) -> Optional[Position]:
        """``{"xinPx": 825, "yinPx": 1200}`` -> :class:`~models.position.Position`."""
        if not isinstance(node, dict):
            return None
        return Position(x=node.get("xinPx", 0), y=node.get("yinPx", 0))

    @staticmethod
    def _java_variables(nodes: Any) -> List[JavaVariable]:
        return [
            JavaVariable(name=node.get("name", ""), kind=node.get("kind", ""))
            for node in nodes or []
        ]

    # -- tree walking ----------------------------------------------------

    @classmethod
    def _find_diagram_nodes(cls, node: Any) -> Iterator[Dict[str, Any]]:
        """Yield every ``type: diagram`` file node of the export tree."""
        if isinstance(node, dict):
            if node.get("type") == DIAGRAM_NODE_TYPE:
                yield node
                return
            yield from cls._find_diagram_nodes(node.get("content"))
        elif isinstance(node, list):
            for child in node:
                yield from cls._find_diagram_nodes(child)

    @staticmethod
    def _first(diagrams: List[Diagram], source: str) -> Diagram:
        if not diagrams:
            raise CbcParseError(f"no diagram found in {source}")
        return diagrams[0]


def parse_file(path: Union[str, Path]) -> Diagram:
    """Parse the first diagram of the CorC JSON file at *path*."""
    return CbcJsonParser().parse_file(path)


def parse_string(text: str) -> Diagram:
    """Parse the first diagram of the CorC JSON document *text*."""
    return CbcJsonParser().parse_string(text)
