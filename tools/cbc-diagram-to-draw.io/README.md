# cbc-diagram-to-draw.io
Converts CbC diagrams imported from WebCorC into [draw.io](https://www.draw.io) diagrams

## Converting a diagram

```
python main.py samples/*.json --drawio out              # writes CbC_<name>.drawio
python main.py samples/MaxElement.json --drawio         # into the current directory
```

Each diagram becomes one draw.io file, `CbC_MaxElement.drawio` for a diagram
named `MaxElement`: one 300×40 box per statement holding its
[triple](#the-gcl-style), and one arrow per refinement carrying the step's
title (`S₁: COMPOSITION`) as an edge label to its right. Boxes keep that fixed
size and long triples simply overflow them — the layout is meant to be tidied up
by hand in draw.io.

Each box wears its step number in a small circle in its top left corner: the
root is `0`, every other box carries the number it was named with in its parent,
the `S₁`, `S₂`, … that this step spells out. The variables and global conditions
stand beside the root as plain notes and carry no circle.

## Inspecting a diagram

```
python main.py samples/MaxElement.json                 # readable tree
python main.py samples/*.json --style gcl              # guarded commands
python main.py samples/MaxElement.json --style json    # normalized JSON
python main.py samples/MaxElement.json -o out.txt      # write to a file
```

## Repairing a diagram

Every parsed diagram is repaired before it is rendered or written. A repair
rewrites what a CbC rule says is wrong and reports each condition it touched on
stderr, so the output is never silently different from the exported file:

```
repair: rewrote 2 conditions in 1 statement -- re-run with --no-repair to keep the diagram as it was exported.
  MaxElement: REPETITION 'Repetition' precondition
    was  maxe(A,0,j,i) && j != A.length
    now  A.length > 0 && i == 0 && j == 1
    why  handed down by the composition above it, as its second statement
  MaxElement: REPETITION 'Repetition' postcondition
    was  maxe(A,0,j,i)
    now  maxe(A, 0, A.length, i)
    why  handed down by the composition above it, as its second statement
```

`--no-repair` keeps the diagram exactly as exported. The report goes to stderr,
so `--style json` stays valid JSON and `-o` writes the rendering alone.

### Contracts

A statement's pre- and postcondition belong to the slot it fills, not to the
statement itself: the refinement tree hands them down from above.

| Above it      | What it hands down                                          |
| ------------- | ------------------------------------------------------------ |
| `ROOT`        | its own contract                                            |
| `COMPOSITION` | `{pre} first {intermediate}` and `{intermediate} second {post}` |
| `SELECTION`   | `{pre && guard_i} command_i {post}`                         |
| `REPETITION`  | `{invariant && guard} body {invariant}`                     |

`repair/contracts.py` reads that table off the tree; conditions the parent does
not have are handed down as `None` and nothing is invented.

### Repetitions

WebCorC exports loops carrying the contract of their own *body* — the one the
loop hands down — instead of the one handed to them: the precondition reads
`invariant && guard` and the postcondition a bare `invariant`. In the samples
this is the only thing that ever disagrees with the tree: of 66 handed-down
conditions, the 8 that mismatch are all loop pre- and postconditions.

Both are replaced by what the statement above hands the loop. The invariant and
the guard stay where they are — they are the loop's proof obligation (`pre =>
I`, `I && !G => post`), not its contract.

Conditions are compared by their top-level `&&` operands, ignoring whitespace,
order and wrapping parentheses, so a loop that already agrees with its parent is
left untouched. A loop whose parent has no condition for a slot keeps the one it
carries.

## Rendering styles

`--style` (alias `--format`) picks how the parsed diagrams are printed:

| Style  | Output                                                          |
| ------ | --------------------------------------------------------------- |
| `text` | indented tree of the whole diagram (default)                    |
| `gcl`  | the refinement steps as annotated guarded commands, in HTML     |
| `json` | the models as normalized JSON (`--indent` sets the indentation) |

### The `gcl` style

Every statement becomes one numbered refinement step: a title naming the
placeholder it refines and its type, then its guarded-command form between
pre- and postcondition.

| Type          | Body                                                   |
| ------------- | ------------------------------------------------------ |
| `ROOT`        | `{pre} S_1 {post}`                                     |
| `STATEMENT`   | `{pre} i := 0; {post}` (Java `=` becomes `:=`)         |
| `SKIP`        | `{pre} skip {post}`                                    |
| `COMPOSITION` | `{pre} S_a {intermediate} S_b {post}`                  |
| `SELECTION`   | `{pre} if Guard1 → S_a elif Guard2 → S_b fi {post}`    |
| `REPETITION`  | `{pre} do [invariant, variant] Guard → S_a od {post}`  |

`S_a`, `S_b` being the numbers of the nested statements.

Numbers are handed out level by level, left to right and top to bottom, so a
statement is numbered before the statements it refines into and the steps come
out in ascending order. The root refines nothing and stays plain `S`; every
other statement is `S<sub>n</sub>` starting at 1 — including the branches of a
selection, which use their global number rather than a local one.

Conditions are written with mathematical symbols:

| Written              | Becomes  |
| -------------------- | -------- |
| `&&`, `\|\|`         | `∧`, `∨` |
| `\forall`, `\exists` | `∀`, `∃` |
| `<=`, `>=`           | `≤`, `≥` |
| `==`, `!=`           | `=`, `≠` |
| `->`, `==>`          | `→`, `⇒` |

The guarded command's own arrow (`if Guard -> S`, `do Guard -> S od`) is the same
`→`; JML's `==>` keeps a double arrow so an implication stays apart from it. All
remaining text is HTML-escaped (`&lt;`, `&gt;`), the index is a `<sub>` tag, and
line breaks stay real newlines:

```html
S<sub>3</sub>: REPETITION
    {A.length &gt; 0 ∧ i = 0 ∧ j = 1} do [maxe(A,0,j,i), A.length - j] j ≠ A.length → S<sub>6</sub> od {maxe(A, 0, A.length, i)}

S<sub>7</sub>: SELECTION
    {maxe(A,0,j,i) ∧ j ≠ A.length} if A[j] &gt; A[i] → S<sub>9</sub> elif A[j] ≤ A[i] → S<sub>10</sub> fi {maxe(A,0,j+1,i)}

S<sub>9</sub>: STATEMENT
    {maxe(A,0,j,i) ∧ j ≠ A.length ∧ A[j] &gt; A[i]} i := j; {maxe(A,0,j+1,i)}
```

The table is for conditions only. A `STATEMENT`'s Java code keeps its own
spelling and is only rewritten where it is an assignment, `i = 0;` to `i := 0;`.
A lone `<`, `>` or `!` stays the plain ASCII sign everywhere — Unicode has no
mathematical variant of `<` and `>` to match `≤` and `≥` with.

## Layout

| Path                        | Purpose                                                      |
| --------------------------- | ------------------------------------------------------------ |
| `main.py`                   | CLI: arguments, file loading, output                         |
| `parser/cbc_json_parser.py` | extracts the models from the WebCorC JSON                    |
| `models/`                   | one model per statement type, plus `Diagram` and `Condition` |
| `repair/`                   | one module per repair, registered in `repair/__init__.py`    |
| `rendering/`                | one module per style, registered in `rendering/__init__.py`  |
| `drawio/`                   | builds and writes the `.drawio` files                        |

A new style is a module with a `render(diagrams, options)` function plus an
entry in `rendering.RENDERERS` — the CLI picks up its name automatically. A new
repair is a module with a `repair(diagram)` function returning the `Fix`es it
made, plus an entry in `repair.REPAIRS`.

### The `drawio` module

| Path                 | Purpose                                                    |
| -------------------- | ---------------------------------------------------------- |
| `drawio/document.py` | `to_xml(diagram)` — the mxGraph XML: boxes, badges, edges  |
| `drawio/layout.py`   | `tree_layout(diagram)` — where each box goes               |
| `drawio/writer.py`   | `write(diagram, dir)` / `write_all(...)` — the named files |

The labels are the HTML of the `gcl` style, which is what draw.io wants in a
`html=1` cell: the triple goes into the box, the step title onto the arrow that
refines into it. Boxes are a fixed 300×40 and long triples overflow them. The
step number rides along as a 12×12 ellipse parented to the box, inset 2px from
its top left corner so that it moves with the box. The triple is wrapped in a
`<div style="text-indent:8px">` to start clear of it — CSS indents the first
line and only the first line, and re-applies it whenever draw.io re-wraps the
label, so the indent survives resizing and editing the box by hand.

The boxes get a fresh tree layout — one row per refinement level, leaves packed
left to right, parents centred above their children — because WebCorC's own
coordinates (kept as `Statement.position`) place its nodes about 250px apart.
Rows and columns are 40px apart and the drawing starts 40px into the page.

The page is a landscape A4 (1169×826) at `pageScale="1"`, and nothing is ever
scaled to it: boxes stay 300×40 and a tree wider than one page runs across
several. The layout is a starting point for the import — rearrange it by hand in
draw.io.

```python
import drawio
from parser import parse_file

drawio.write(parse_file("samples/MaxElement.json"), "out")  # -> out/CbC_MaxElement.drawio
```

## Extracted data

`Diagram`: `name`, `java_variables`, `global_conditions`, `root`. Its
`precondition`, `postcondition` and `statement` are shortcuts to the root's.

The contract written directly in the diagram's `content` is a statement of its
own type, `ROOT`, wrapping the statement that has to fulfil it. Every statement
carries `type`, `precondition`, `postcondition`, `name`, `id`, `position`; per
type additionally:

| Type          | Model              | Extra fields                                                    |
| ------------- | ------------------ | --------------------------------------------------------------- |
| `ROOT`        | `Root`             | `statement`                                                     |
| `STATEMENT`   | `ProgramStatement` | `program_statement`                                             |
| `SKIP`        | `Skip`             | –                                                               |
| `COMPOSITION` | `Composition`      | `intermediate_condition`, `first_statement`, `second_statement` |
| `REPETITION`  | `Repetition`       | `variant`, `invariant`, `guard`, `loop_statement`               |
| `SELECTION`   | `Selection`        | `guards`, `commands` (guard *i* belongs to command *i*)         |

## Using it as a library

The parser stays faithful to the file — repairing is a step of its own:

```python
import repair
from parser import parse_file

diagram = parse_file("samples/MaxElement.json")   # as exported
print(repair.apply([diagram]).text())             # repaired in place

for statement in diagram.walk():          # the ROOT first, then depth first
    print(statement.type, statement.precondition, statement.postcondition)
```
