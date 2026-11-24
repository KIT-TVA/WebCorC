"""Command line entry point: parse CorC diagram JSON and render it.

    python main.py samples/MaxElement.json
    python main.py samples/*.json --style hoare
    python main.py samples/MaxElement.json --style json --output out.json
    python main.py samples/MaxElement.json --no-repair

Parsed diagrams are repaired before they are rendered or written; the repairs
report what they changed on stderr.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from typing import List, Optional

import drawio
import repair
import rendering
from models import Diagram
from parser import CbcJsonParser, CbcParseError


def build_arg_parser() -> argparse.ArgumentParser:
    arg_parser = argparse.ArgumentParser(
        prog="main.py",
        description="Parse CorC diagram JSON files and render their statements.",
    )
    arg_parser.add_argument(
        "files",
        nargs="+",
        type=Path,
        metavar="FILE",
        help="CorC diagram JSON file(s) to parse",
    )
    arg_parser.add_argument(
        "-s",
        "--style",
        "-f",
        "--format",
        dest="style",
        choices=rendering.STYLES,
        default=rendering.DEFAULT_STYLE,
        help=f"rendering style (default: {rendering.DEFAULT_STYLE})",
    )
    arg_parser.add_argument(
        "-o",
        "--output",
        type=Path,
        metavar="FILE",
        help="write the output to FILE instead of stdout",
    )
    arg_parser.add_argument(
        "--indent",
        type=int,
        default=2,
        help="indentation of the JSON output (default: 2)",
    )
    arg_parser.add_argument(
        repair.FLAG,
        dest="repair",
        action="store_false",
        help="keep the diagrams as exported, broken conditions and all, "
        "instead of repairing them first",
    )
    arg_parser.add_argument(
        "-d",
        "--drawio",
        nargs="?",
        type=Path,
        const=Path("."),
        metavar="DIR",
        help="write a CbC_<name>.drawio file per diagram into DIR "
        "(default: the current directory) instead of rendering to stdout",
    )
    return arg_parser


def parse_files(paths: List[Path]) -> List[Diagram]:
    """Parse every diagram of every given file."""
    cbc_parser = CbcJsonParser()
    diagrams: List[Diagram] = []
    for path in paths:
        diagrams.extend(cbc_parser.parse_file_all(path))
    if not diagrams:
        raise CbcParseError("no diagram found in the given file(s)")
    return diagrams


def main(argv: Optional[List[str]] = None) -> int:
    args = build_arg_parser().parse_args(argv)

    try:
        diagrams = parse_files(args.files)
    except (CbcParseError, OSError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if args.repair:
        report = repair.apply(diagrams)
        if report:
            print(report.text(), file=sys.stderr)

    if args.drawio is not None:
        try:
            for path in drawio.write_all(diagrams, args.drawio):
                print(path)
        except OSError as exc:
            print(f"error: {exc}", file=sys.stderr)
            return 1
        return 0

    output = rendering.render(
        diagrams, args.style, rendering.RenderOptions(indent=args.indent)
    )

    if args.output:
        args.output.write_text(output + "\n", encoding="utf-8")
    else:
        _print(output)
    return 0


def _print(output: str) -> None:
    """Print as UTF-8 -- conditions carry ``∧`` and ``∨``, which the Windows
    default code page cannot encode."""
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    print(output)


if __name__ == "__main__":
    sys.exit(main())
