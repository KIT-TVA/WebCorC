package edu.kit.cbc.web.util;

public enum ProofType {
	// These are use to differ between proof types in VerifyAllStatements.proveStatement
	Variant,
	Postcondition,
	Precondition,
	FullProof;
}
