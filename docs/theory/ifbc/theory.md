# Information Flow Control-by-Construction

Constructing a programm which adheres to some specifications regarding information flow using Information Flow Control-by-Construction (IFbC) starts with an abstract hoare triple **{P, V<sup>pre</sup>} S {Q, V<sup>post</sup>}[η]** furtherly called an IFbC triple. 

Here **P** and **Q** are the pre- and postconditions of the programm to be constructed and **S** is an abstract implementation such iff **P** holds and **S** is executed, that **Q** is true afterwards. **V<sup>pre</sup>, V<sup>post</sup>** are the labelling functions assigning each variable used in **S** two labels, one for its confidentiality level and one for its integrity level. Lastly, **η** is a context security parameter and is itself a specific confidentiality level and an integrity level. It represents the information indirectly obtained by e.g. which branch is selected or how many iterations a loop takes.

Given a set of **refinement rules**, we can **refine** the abstract program **S** iteratively to concrete code. Certain refinement rules require further specifications to be defined, e.g., loop invariants or intermediate conditions.

## Security Lattice
To correctly define wether a given security level is higher than another, i.e. *private > public*, one needs a **security lattice**. A security lattice is directed, acyclic graph over the set of all security levels with exactly one source and one sink vertex, representing the minimal and maximal security level respectively.

For security levels *a, b* with *a → b* it is clear that *b* is the higher security level and automatically implies *a*. The same is true if there is a path *a → ... → b*.

If one needs to fulfill two security levels *a, b* which are not path-connected, one needs the **least upper bound of a and b** which is notated by **lub(a,b)**.
The **lub(a,b)** always exists and is given by the single security level *x* for which *a → ... → x* and *b → ... → x* is true and for any other such levels *y* it also holds that *x → ... → y*.
This results in *x* being the "*lowest*" vertex in a topological representation of the lattice.
Inductively, one defines the **lub(a,b,...)** and over sets of levels **lub({a, b, ...})**.

Path-connectedness also implies a half-ordering of the security levels, thus **a < b iff a → ... → b**. 

---

## ↪️ Refinement Rules
In the following, **vars(X)** is the set of all variables used in the expression **X** and **E** is the set of all possible expressions over all variables **Vars**.


Similarly to **CbC**, **S** is constructed iteratively using the following refinement rules.
Each refinement rule comes with (a set of) **side conditions** that need to be met to be applicable at a certain point in a program. These side conditions can be proven and guarantee functional correctness once verified.

- **Skip** | *{V<sup>pre</sup>} skip {V<sup>post</sup>}[η] iff V<sup>pre</sup>(x) = V<sup>post</sup>(x) for all variables x*  
    The skip rule can be applied if both the variables and their security level do not change. The abstract statement S can be refined to skip and does not change the state of the program.

- **Assignment** | *{V<sup>pre</sup>} x := E {V<sup>post</sup>}[η] iff V<sup>post</sup>(y) = V<sup>pre</sup>(y) for all y ∈ Vars \ {x} and V<sup>post</sup>(x) = lub({V<sup>pre</sup>(x), η } ∪ {V<sup>pre</sup>(y) | y ∈ vars(E)})*  
    Using the assignment rule, an expression E of type T can be assigned to a variable x of the same type T. An abstract statement S can be refined to the assignment x:=E if all variables except of x keep their security level unchanged and x has the same security level as the lub of all used variables of E, its previous security level and the given security context.

- **Composition** | *{V<sup>pre</sup>} S<sub>1</sub> ; S<sub>2</sub> {V<sup>post</sup>}[η] iff there is an intermediate labelling function V' such that {V<sup>pre</sup>} S<sub>1</sub> {V}[η] and {V} S<sub>2</sub> {V<sup>post</sup>}[η] and for all v ∈ Vars : V<sup>pre</sup>(v) ≤ V'(v) ≤ V<sup>post</sup>(v)*  
    Using the composition rule, it is possible to split an abstract statement S into two abstract statements S<sub>1</sub> and S<sub>2</sub>. To do so, an intermediate labelling function V' has to be introduced. V' has to be compatible with the security levels of the pre and post variable labellings of the abstract statements S<sub>1</sub> and S<sub>2</sub> respectively. With this, the security levels assigned by V' have to be stronger than given by V<sup>pre</sup> and weaker than those given by V<sup>post</sup>.

- **Selection** | *{V<sup>pre</sup>} if G<sub>1</sub> → S1 elseif . . . G<sub>n</sub> → S<sub>n</sub> fi {V<sup>post</sup>} iff {V<sup>pre</sup>} S<sub>1</sub> {V<sup>post</sup>}[η'], ... {V<sup>pre</sup>} S<sub>n</sub> {V<sup>post</sup>}[η'] with η' lub({V<sup>pre</sup>(v) | v ∈ vars(G<sub>1</sub> ∪ ... ∪ G<sub>n</sub>)} ∪ {η})*  
    The selection rule can be used to refine the abstract statement S into various cases. Every case is indicated by a guard G<sub>i</sub>. The IFbC riples of the different cases consist of the pre labelling function V<sup>pre</sup>, the refined abstract statement S<sub>i</sub>, and the post labelling function V<sup>post</sup>. To prevent any information of the guards being leaked, the assigned security levels by the V<sup>post</sup> must be atleast as high as the *lub* of all variables used in any guard.

- **Repetition** | *{V<sup>pre</sup>} do G → S od {V<sup>post</sup>}[η] iff {V<sup>pre</sup>} do S od {V<sup>post</sup>}[η'] with η' = lub({V^sup>pre</sup>(v) | v ∈ vars(G)} ∪ {η})*  
    The repetition rule introduces a classic while loop. By executing the loop, information about the guard is revealed. To prohibit this indirect leak, the security context of the inner loop statement is adjusted to the least upper bound of the security levels of the loop-guard and the security context of the outer repetition statement.

- **Method Call** | *{V<sup>pre</sup>} M(a<sub>1</sub>, ..., a<sub>n</sub>) {V<sup>post</sup>}[η] iff for a method {V<sup>pre</sup><sub>call</sub>} M(z<sub>1</sub>, ..., z<sub>n</sub>) {V<sup>post</sup><sub>call</sub>}[η] and for all parameters: V<sup>pre</sup>(a<sub>i</sub>) ≤ V<sup>pre</sup><sub>call</sub>(z<sub>i</sub>) and V<sup>post</sup><sub>call</sub>(z<sub>i</sub>) ≤ V<sup>post</sup>(a<sub>i</sub>) where a<sub>i</sub> are the actual parameters and z<sub>i</sub> are the formal parameters*  
In a method call, all variables are passed by value-result and appear in the specification of the method. The security level of these passed variables may change, while the security level of other variables remains the same. By calling the method, the parameters of the caller are assigned to the parameters of the called method and the reverse assignment is done when returning from the method. It has to be ensured that in the beginning the security levels of variables of the called method are higher than or equal to the security levels of variables of the caller to prevent flows from higher to lower security levels. It also has to be ensured that the security levels in the postcondition of the caller are higher than or equal to the security levels of the called method for the same reason. For example, a secure value of the method has to be assigned to a variable with at least this security level in the program of the caller. Additionally, the called method has to satisfy its specification, which can be shown in a separate IFbC refinement.
---

## Declassification
With the above refinement rules, it is not possible to assign the value of a higher security level expression to a lower security level variable. As this is quite limiting and as in most cases it is desirable to explicitly lower the security level (e.g. as a password would be hashed or encrypted), one can use the **declassify** operator.

- **Declassification Assignment** | *{V<sup>pre</sup>} x := declassify(E) {V<sup>post</sup>}[η] iff V<sup>post</sup>(y) = V<sup>pre</sup>(y) for all y ∈ Vars \ {x} and V<sup>post</sup>(x) = lub({V<sup>pre</sup>(x), η })

Note that the declassification assignment still respects the security context η and cannot be used to assign an arbitrary security level directly. But by introducing additional variables one can rewrite any guards used in the selection or repetition rules to have the desired lower security level by additionally using the declassification assignment as required.

Implementing a program using Correctness-by-Construction (CbC) starts with an abstract hoare triple **{P} S {Q}** where symbols **P** and **Q** are the pre- and postcondition of the program to be constructed, and symbol **S** represents the implementation abstractly. 

---

IFbC requires that used variables adhere to specific confidentiality and integrity levels.
With the above refinement rules, the confidentiality is immediately guaranteed. For integrity, one uses the same rules but with the security lattice *trusted -> untrusted*.

An examplary construction of a program using IFbC can be found [here](example.md).

The set of basic refinement rules is extended by tool-specific rules. 