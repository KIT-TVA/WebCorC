package edu.kit.cbc.common.corc.parsing;

public class SemanticException extends Exception {
    private final String variableName;

    public SemanticException(String message) {
        super(message);
        this.variableName = null;
    }

    public SemanticException(String message, String variableName) {
        super(message);
        this.variableName = variableName;
    }

    public String getVariableName() { return variableName; }
}
