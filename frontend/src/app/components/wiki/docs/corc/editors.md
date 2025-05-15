## Graphical Editor
The graphical editor provides diagram elements to create CbC programs graphically.
[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/graphical-editor.png]]

- The white canvas contains the content of a CbC program, which in this case is called `graphical_editor`.
- The `Palette` contains all tools to manipulate the diagram, including all [CorC refinements](#corc-refinement-rules).
- The window tabs on the bottom are called `Eclipse property views`. These can be opened and closed on demand through `Window -> Show View -> Other...`.

## Textual Editor
In addition to the [graphical editor](#graphical-editor), we provide a textual editor called [*LOST-Editor*](). The LOST-Editor is based on the *LOST* DSL and is accessible through the Eclipse property view (`Window -> Show View -> LOST-Editor`). In LOST, each line represents an operation or is part of Java code. A line followed by a tab indicates a new refinement. With this, we get a tree-like code structure in which the number of tabs represents the depth of the tree of a CorC diagram before each refinement. Developers specify refinements sequentially, starting from the abstract hoare triple and continuing through its refinements sequentially. LOST supports the same refinement rules as the graphical editor:
- `F(pre: [preCondition], post: [postCondition])` - Formula with pre- and post-condition.
- `C(intm: [intermediateCondition])` - Composition with its intermediate condition.
- `S(guard: [guard1], guard: [guard2], ...)` - Selection statement and its guards.
- `L(inv: [invariant], guard: [guard], var: [variant])` - Repetition statement ("Loop") and its invariant, guard, and variant.
- `[statement] ;` - Basic statement.
- `O: [statement] ;` - Original statement. Used in SPLs to refer to the definition of the parent of any given method.
- `R: [statement] ;` - Return statement.
- `M: [statement] ;` - Method call statement.
- `skip` - Skip statement.
- `{ [statements] }` - Block of Java code.

Additionally, each refinement rule supports the specification of *modifiables* variables. Specify the initializer `mod: [modifiable]` as the first parameter of any refinement rule, e.g., `F(mod: x, pre: x > 0, post: y > 0)`. Further details are described in the [LOST-documentation](https://www.overleaf.com/read/cbnncfypyvqj#47edca).
