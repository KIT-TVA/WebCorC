# WebCorC Ecosystem: What it is and why it matters
Functional correctness is a central aspect of every software system. Software development approaches based on test cases are a fast and reliable way to show that the tested parts of a software system function as intended. However, the main advantage of test case generation, partial guarantees, is also its biggest drawback. Comprehensive functional correctness guarantees are required in many software systems, and verification is used to ensure that.

Correctness-By-Construction (CbC) engineering introduced by [Kourie and Watson](#references) is based on [Design-by-Contract](#references), which connects contracts with programs. Using logical formulas, a program's contract formally specifies what it expects as input, the precondition, and which outputs it produces, the postcondition. Traditionally, once a program is implemented and specified, it is verified afterwards whether it fulfills its obligations according to its contract. This approach is called [post-hoc verification](#references). The main idea behind CbC is to guide developers in incrementally specifying and implementing a program. Stepwise specification and implementation enable the creation of correct programs by construction since each specification and implementation step can be verified through deductive verifiers. This is the key advantage of CbC compared to post-hoc verification. Implementing a program using CbC starts with an abstract hoare triple `{P}S{Q}` where symbols `P` and `Q` are the pre- and postcondition of the program, and symbol `S` represents the implementation abstractly. Given a set of *refinement rules*, we can *refine* the symbol `S` iteratively to concrete code. Each refinement rule has side conditions that we must specify. 

# CbC/CorC-Related Papers
- M. Kodetzki, T. Bordis, T. Runge, and I. Schaefer. Partial Proofs to Optimize Deductive Verification of Feature-Oriented Software Product Lines. In 18th International Working Conference on Variability Modelling of Software-Intensive Systems (VaMoS'24), 2024.
- T. Runge, T. Bordis, A. Potanin, T. Thüm, and I. Schaefer. Flexible Correct-by-Construction Programming. In Logical Methods in Computer Science, Volume 19, 2023.
- T. Runge, Correctness-by-Construction for Correct and Secure Software Systems. Dissertation, 2023.
- T. Runge, M.erveto, A. Potanin, and I. Schaefer. Immutability and Encapsulation for Sound OO Information Flow Control. In ACM Transactions on Programming Languages and Systems, Volume 45, 2023.
- T. Runge, A. Potanin, T. Thüm, and I. Schaefer. Traits for Correct-by-Construction Programming. In CoRR 2022.
- T. Bordis, T. Runge, D. Schultz, and I.Schaefer. Family-Based and Product-Based Development of Correct-by-Construction Software Product Lines. In Journal of Computer Languages #COLA), 2022.
- T. Bordis, L. Cleophas, A. Kittelmann, T. Runge, I. Schaefer, and B. W. Watson. Re-CorC-ing KeY: Correct-by-Construction Software Development Based on KeY. In The Logic of Software. A Tasting Menu of Formal Methods, 2022.
- T. Runge, A. Potanin, T. Thüm, and I. Schaefer. Traits: Correctness-by-Construction for Free. In FCRTE 2022.
- A. Kittelmann, T. Runge, T. Bordis, and I. Schaefer. Runtime Verification of Correct-by-Construction arriving Maneuvers. ISoLA 2022.
- T. Bordis, M. Kodetzki, T. Runge, and I. Schaefer. VarCorC: Developing Object-Oriented Software Product Lines Using Correctness-by-Construction. In SEFM Workshops, 2022.
- T. Runge, A. Kittelmann, M. Servetto, A. Potanin, and I. Schaefer. Information Flow Control-by-Construction for an Object-Oriented Language. SEFM 2022.
- I. Schaefer, T. Runge, L. Cleophas, and B. W. Watson. Tutorial: The Correctness-by-Construction Approach to Programming Using CorC. SecDev, 2021.
- T. Runge, T. Bordis, T. Thüm, and I. Schaefer. Teaching Correctness-by-Construction and Post-hoc Verification - The Online Experience. FMTea, 2021.
- T. Bordis, T. Runge, and I. Schaefer. Correctness-by-Construction for Feature-Oriented Software Product Lines. In GPCE, 2020.
- T. Runge, A. Knüppel, T. Thüm, and I. Schaefer. Lattice-Based Information Flow Control-by-Construction for Security-by-Design. In FormaliSE, 2020.
- A. Knüppel, T. Runge, and I. Schaefer. Scaling Correctness-by-Construction. ISoLA, 2020.
- T. Bordis, T. Runge, A. Knüppel, T. Thüm, and I. Schaefer. Variational Correctness-by-Construction. In 14th International Working Conference on Variability Modelling of Software-Intensive Systems (VaMoS'20e, 2020.
- T. Runge, T. Thüm, L. Cleophas, I. Schaefer, and B. W. Watson: Comparing Correctness-by-Construction with Post-Hoc Verification - A Qualitative User Study. In REFINE, 2019.
- T. Runge, I. Schaefer, L. Cleophas, T. Thüm, D. G. Kourie, and B. W. Watson: Tool Support for Correctness-by-Construction, Proc. of the International Conference on Fundamental Approaches to Software Engineering (FASE), Springer, 2019.
- T. Runge, I. Schaefer, A. Knüppel, L. Cleophas, D. G. Kourie, and B. W. Watson: Tool support for Confidentiality by Construction. In HILT 2018 Workshop on Languages and Tools for Ensuring Cyber-Resilience in Critical Software-Intensive Systems (HILT'18), 2018.
- I. Schaefer, T. Runge, A. Knüppel, L. Cleophas, D. G. Kourie, and B. W. Watson: Towards Confidentiality-by-Construction. In International Symposium on Leveraging Applications of Formal Methods, Springer, 2018.

# References
- Kourie, Derrick G., and Bruce W. Watson. The Correctness-by-Construction Approach to Programming. Vol. 264. Heidelberg: Springer, 2012.
- Meyer, Bertrand. Applying Design by Contract. Computer 25.10 (1992): 40-51.
- Watson, Bruce W., et al. Correctness-by-construction and post-hoc verification: a marriage of convenience?. Leveraging Applications of Formal Methods, Verification and Validation: Foundational Techniques: 7th International Symposium, ISoLA 2016, Imperial, Corfu, Greece, October 10–14, 2016, Proceedings, Part I 7. Springer International Publishing, 2016.
- Bordis, Tabea, et al. Family-based and product-based development of correct-by-construction software product lines. Journal of Computer Languages 70 (2022): 101119.
