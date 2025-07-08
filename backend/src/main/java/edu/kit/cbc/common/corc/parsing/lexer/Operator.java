package edu.kit.cbc.common.corc.parsing.lexer;

import java.util.EnumSet;

public record Operator(OperatorType type, int pos) implements Token {

    @Override
    public int position() {
        return pos();
    }

    public enum OperatorType {

        /*LOGICAL Operators*/
        NOT("!", 0),
        EQUAL("==", 4),
        NOT_EQUAL("!=", 4),
        LESS_THAN("<", 3),
        LESS_THAN_OR_EQUAL("<=", 3),
        GREATER_THAN(">", 3),
        GREATER_THAN_OR_EQUAL(">=", 3),
        LOGICAL_AND("&&", 8),
        LOGICAL_OR("||", 9),
        IMPLICATION("==>", 10),
        EQUIVALENT("<=>", 10),
        FORALL("\\forall", 0),
        EXISTS("\\exists", 0),

        ASSIGN("=", 11),

        /*ARITHMETIC Operators*/
        ARITH_NOT("~", 0),
        ARITH_AND("&", 5),
        ARITH_XOR("^", 6),
        ARITH_OR("|", 7),
        PLUS("+", 2),
        MINUS("-", 2),
        MUL("*", 1),
        DIV("/", 1),
        MOD("%", 1)
        ;


        private final String value;
        private final int precedence;

        OperatorType(String value, int precedence) {
            this.value = value;
            this.precedence = precedence;
        }

        public int getPrecedence() {
            return precedence;
        }

        @Override
        public String toString() {
            return this.value;
        }

        public static int maxPrecedence() {
            return EnumSet.allOf(OperatorType.class).stream()
                    .map(OperatorType::getPrecedence)
                    .max(Integer::compareTo)
                    .get();
        }

    }
}
