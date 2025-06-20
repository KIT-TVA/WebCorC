## CbC Example
Since the introduction is somewhat abstract, we examine how CbC works in a simple example. We want to create a program that returns `TRUE`, iff some natural number `n` is even, else it returns `FALSE`. We will store the return value in a boolean variable `ret`.
Given the abstract hoare triple

`{P} S {Q}`

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

## CbC Refinement Rules
Following is a list of all existing CbC refinement rules:
- **Skip** | **{P} skip {Q}** iff *P* implies *Q*
- **Assignment** | **{P} x := E {Q}** iff *P* implies *Q[x\E]*
- **Composition** | **{P} S1 ; S2 {Q}** iff there is an intermediate condition *M* such that *{P} S1 {M} and {M} S2 {Q}*
- **Selection** | **{P} if G1 → S1 elseif . . . Gn → Sn fi {Q}** iff *(P implies G1 ∨ G2 ∨ . . . ∨ Gn)* and *{P ∧ Gi} Si {Q}* holds for all *i*.
- **Repetition** | **{P} do [I, V] G → S od {Q}** iff *(P implies I)* and *(I ∧ ¬G implies Q)* and *{I ∧ G ∧ V=V<sub>0</sub>} S {I ∧ 0≤V ∧ V < V<sub>0</sub>}* and *{I ∧ G} S {I}*
- **Method Call** | **{P} b := m(a1, ..., an) {Q}** with method *{P′} return r m(param p<sub>1</sub>, ..., p<sub>n</sub>) {Q′}* iff *P implies P′[p<sub>i</sub>\a<sub>i</sub>]* and *Q′[p<sub>old</sub><sup>i</sup> \ a<sub>old</sub><sup>i</sup> , r\b]* implies *Q*
