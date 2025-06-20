## CorC Refinement Rules
CorC's refinement rules build a superset of CbC's refinement rules. Additional refinement rules are:
- **Original Call** | Call the method with the same signature from the parent feature in a [SPL](#software-product-lines).
- **Return Assignment** | Automatically sets the return variable `ret` to the expression returned inside this assignment.

## CorC Example
Let us consider the program from the [CbC Example](#cbc-example) section. We want to implement that program in CorC.

1. Create a new Java Project: `File -> New -> Project... -> Java Project`.
2. Create a folder named `isEven` inside the folder `src`.
3. Create a new CorC diagram: `Right-click -> New -> Other... -> new CorC File`. We name it `isEven`:
[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/corc-example-project-structure.png]]
4. Now we start creating the CbC [program](#cbc-example). We introduced the `Formula f` including it's pre- and postcondition and the variables `boolean ret` and `int n` inside the `Variables` block using drag-and-drop from the `Palette`.
[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/corc-example-formula.png]]
5. We now introduce a `SelectionStatement s` and add another guard by drag-and-dropping an `ExtraSelection` onto the selection `s`. We also connect the abstract hoare triple `f` with selection `s` using the `Refinement` connection.
[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/corc-example-selection.png]]
6. Finally, we add two return assignments `ReturnStatement` and connect them to the selection `s`.
[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/corc-example-full.png]]
7. We now [verify](#verification) the entire CbC program or each refinement rule separately through the context menu.
[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/corc-example-verified.png]]
8. To convert the method `isEven` into Java code, we click `Generate Code` in the context menu.
[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/code-gen.png]]]

