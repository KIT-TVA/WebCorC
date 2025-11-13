# The CorC Ecosystem: Tool Support for by-Construction Engineering

!!! note "News: Our new wiki and documentation is online!"

Functional correctness is a central aspect of every software system. Software development approaches based on test cases are a fast and reliable way to show that the tested parts of a software system function as intended. However, testing only gives partial correctness guarantees, as the absence of bugs cnnot be shown. **Formal verification** on contrast can prove that a software is working as intended w.r.t. its formal specification.

Post-hoc approaches ensuring functional correctness after implementing a software are common techniques to prove a software correct. [**Correctness-by-Construction (CbC)**](theory/cbc/theory.md) instead offers correctness guarantees already during program construction and, thus, enables **early detection and fixing of bugs**.

In CbC, using logical formulas, a program's contract formally specifies what it expects as input, denoted as **precondition**, and which outputs it produces, denoted as **postcondition**. Traditionally, once a program is implemented and specified, it is verified afterwards whether it fulfills its obligations according to its contract. In difference, the main idea in CbC is to guide developers in **incrementally** specifying and implementing a program. Stepwise specification and implementation enable the creation of correct programs by construction since each specification and implementation step can be verified individually.

---

In recent years, the scope of CbC was extended to ensure secure information flow in CbC programs besides functional correctness. We refer to work in the field of non-functional properties in by-Construction engineering as [**X-by-Construction (XbC)**](theory/xbc/xbctheory.md).

## 🛠️ WebCorC and CorC (Eclipse)

