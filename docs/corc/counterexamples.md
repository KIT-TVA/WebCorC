## Counterexample Generation
Our counterexample generation extension is another valuable tool for finding bugs in CbC programs. CorC uses [Z3](https://github.com/Z3Prover/z3/releases) to generate counterexamples for non-closeable proofs. To enable the generation of counterexamples: `View: Properties -> Settings -> Generate Counterexamples`. Once we activate this option, CorC provides a counterexample for every non-closeable proof, if possible. Note that Z3 uses special syntax to represent counterexamples. Their [wiki](https://github.com/Z3Prover/z3/wiki) provides more information.

[[https://github.com/KIT-TVA/CorC/blob/master/Wiki/counterexample.png]]


