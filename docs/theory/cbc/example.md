## CorC Refinement Rules
CorC's refinement rules build a superset of CbC's refinement rules. Additional refinement rules are:

- **Original Call** | Call the method with the same signature from the parent feature in a [SPL](#software-product-lines).

- **Return Assignment** | Automatically sets the return variable `ret` to the expression returned inside this assignment.


## CbC Example
Since the introduction is somewhat abstract, we examine how CbC works in a simple example. We want to create a program that returns `TRUE`, iff some natural number `n` is even, else it returns `FALSE`. We will store the return value in a boolean variable `ret`.
Given the abstract hoare triple

`{P} S {Q}`,

we define pre condition `P := n > 0`. That is, we require the number `n` to be bigger than `0`, which must be ensured
by the callee.
Consequently, the program must ensure the following postcondition `Q := (n % 2 == 0 -> ret = TRUE) & (n % 2 != 0 -> ret = FALSE)`
after execution. We now decide to use the *selection refinement rule*, which is similar to branching in Java to refine
the abstract hoare triple into a new refinement:

```
{P} S {Q} 
⊑ {P} if G1 -> S1 elseif G2 -> S2 {Q}
```

As we can see, there are some new conditions `G1, G2`, called guards, and abstract statements `S1, S2`. 
Guards `G1` and `G2` are the required side conditions for the selection refinement for our example. 
As we will see, statements `S1` and `S2` can be further refined separately. 
Since we want to differentiate between the number `n` being even `n % 2 = 0` and uneven `n % 2 != 0`, we use
these as guards `G1 := n % 2 = 0` and `G2 := n % 2 != 0`.

Lastly, we need to refine statements `S1` and `S2`. We use the *statement refinement rule* for both:

```
{P} S {Q} 
⊑ {P} if G1 -> S1 elseif G2 -> S2 {Q}
⊑ {P} if G1 -> TRUE elseif G2 -> S2 {Q}
⊑ {P} if G1 -> TRUE elseif G2 -> FALSE {Q}
```
with
```
P := n > 0
Q := (n % 2 = 0 -> ret = TRUE) & (n % 2 != 0 -> ret = FALSE)
G1 := n % 2 = 0
G2 := n % 2 != 0
```

We have created a fully specified CbC program that can be verified with a deductive verifier like [KeY](https://github.com/KeYProject/key). One of the main benefits of this approach compared to post-hoc verification is that we can also verify every refinement step independently, which is challenging with post-hoc verification.





//TODO THIS IS ECLIPSE


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

