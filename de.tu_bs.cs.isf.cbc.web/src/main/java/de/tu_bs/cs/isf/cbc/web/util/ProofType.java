package de.tu_bs.cs.isf.cbc.web.util;

public enum ProofType {
	// These are use to differ between proof types in VerifyAllStatements.proveStatement
	Variant,
	Postcondition,
	Precondition,
	FullProof;
}
