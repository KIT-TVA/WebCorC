package edu.kit.cbc.common.corc.parsing.lexer;

public record Operator(OperatorType type) implements Token {

    public enum OperatorType {

        /*LOGICAL Operators*/
        NOT("!"),
        EQUAL("=="),
        NOT_EQUAL("!="),
        LESS_THAN("<"),
        LESS_THAN_OR_EQUAL("<="),
        GREATER_THAN(">"),
        GREATER_THAN_OR_EQUAL(">="),
        AND("&&"),
        OR("||"),
        IMPLICATION("==>"),
        EQUIVALENT("<=>"),
        FORALL("\\forall"),
        EXISTS("\\exists"),

        /*ARITHMETIC Operators*/
        PLUS("+"),
        MINUS("-"),
        MUL("*"),
        DIV("/"),
        MOD("%")
        ;


        private final String value;

        OperatorType(String value) {
            this.value = value;
        }

        @Override
        public String toString() {
            return this.value;
        }
    }
}
