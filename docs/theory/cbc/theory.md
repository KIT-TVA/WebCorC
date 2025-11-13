# 🏗️ Correctness-by-Construction

Implementing a program using Correctness-by-Construction (CbC) starts with an abstract hoare triple **{P} S {Q}** where symbols **P** and **Q** are the pre- and postcondition of the program to be constructed, and symbol **S** represents the implementation abstractly. Given a set of **refinement rules**, we can **refine** the abstract program **S** iteratively to concrete code. Certain refinement rules require further specifications to be defined, e.g., loop invariants or intermediate conditions.

Each refinement rule comes with (a set of) **side conditions** that need to be met to be applicable at a certain point in a program. These side conditions can be proven and guarantee functional correctness once verified.

## ↪️ Refinement Rules

Below, we show the basic set of refinement rules supported by the CorC ecosystem. We provide the examplary construction of a program using CbC [here](example.md).

- **Skip** | *{P} skip {Q} iff P implies Q*  
    The skip rule can be applied if precondition P is fulfilled as soon as postcondition Q is fulfilled. The abstract statement S can be refined to skip and does not change the state of the program.
- **Assignment** | *{P} x := E {Q} iff P implies Q[x\E]*  
    Using the assignment rule, an expression E of type T can be assigned to a variable x of the same type T. An abstract statement S can be refined to the assignment x:=E if precondition P implies postcondition Q and every occurrence of variable x in postcondition P is replaced by expression E.    
- **Composition** | *{P} S1 ; S2 {Q} iff there is an intermediate condition M such that {P} S1 {M} and {M} S2 {Q}*  
    Using the composition rule, it is possible to split an abstract statement S into two abstract statements S1 and S2. To do so, an intermediate condition M has to be introduced. Condition M has to be fulfilled after executing the abstract statement S1 and before executing the abstract statement S2. With this, the intermediate condition M has to be stronger than precondition P and weaker than postcondition Q.
- **Selection** | *{P} if G1 → S1 elseif . . . Gn → Sn fi {Q} iff (P implies G1 ∨ G2 ∨ . . . ∨ Gn) and {P ∧ Gi} Si {Q} holds for all *i*  
    The selection rule can be used to refine the abstract statement S into various cases. Every case is indicated by a guard Gi. The Hoare-triples of the different cases consist of the precondition P ∧ Gi, the refined abstract statement Si, and the postcondition Q. The statement whose guard is fulfilled first is called.
- **Repetition** | *{P} do [I, V] G → S od {Q} iff (P implies I) and (I ∧ ¬G implies Q) and {I ∧ G ∧ V=V0} S {I ∧ 0 ≤ V ∧ V < V0} and {I ∧ G} S {I}*  
    The repetition rule works similar to a while-loop known from different programming languages. As long as guard G is evaluated to true, the loop statement S is executed. A set of conditions has to be fulfilled to be able to apply the repetition rule: Loop invariant I has to be implied by precondition P. The conjunction of the invariant I and the negated guard G have to imply postcondition Q. The loop statement S has to preserve the invariant I. With showing that variant V is monotonically decreasing and has zero as lower bound, the termination of the loop is guaranteed.

---
The set of basic refinement rules is extended by tool-specific rules. Original- and variational method call rule belong to concepts of software product lines, which are explained in more detail [here](../../corc/spls.md).

- **Method Call** | *If {P} $\Rrightarrow$ {P'}[pi\ai]$ and Q'[pi^old\ai^old, r\b] $\Rrightarrow$ Q then {P} S {Q} can be refined to {P} M(a1, ..., an, b) {Q} with the method {P'} M(param p1, ..., param pn, return r) {Q'}.*  
Using the method-call rule, it is possible to implement Call-by-Value method-calls. For this, a method M can be called with an optional set of parameters. The parameters ai and the variable b which is reserved for the return value, represent the current values and can be used in the conditions P and Q. The formal parameters pi and r can be part of the precondition P'. They are set to the corresponding parameters ai and b when calling the method. To access the variables' values prior the execution of the called method in the postcondition Q', the parameters can be annotated with a superscripted *old*.