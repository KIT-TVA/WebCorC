package edu.kit.cbc.common.corc.parsing.lexer;

import java.util.EnumSet;
import lombok.Getter;

public record Operator(OperatorType type) implements Token {

    public enum OperatorType {

        /*LOGICAL Operators*/
        NOT("!", 0),
        EQUAL("==", 4),
        NOT_EQUAL("!=", 4),
        LESS_THAN("<", 3),
        LESS_THAN_OR_EQUAL("<=", 3),
        GREATER_THAN(">", 3),
        GREATER_THAN_OR_EQUAL(">=", 3),
        AND("&&", 5),
        OR("||", 6),
        IMPLICATION("==>", 7),
        EQUIVALENT("<=>", 7),
        FORALL("\\forall", 0),
        EXISTS("\\exists", 0),

        /*ARITHMETIC Operators*/
        PLUS("+", 2),
        MINUS("-", 2),
        MUL("*", 1),
        DIV("/", 1),
        MOD("%", 1)
        ;


        private final String value;
        @Getter
        private final int precedence;

        OperatorType(String value, int precedence) {
            this.value = value;
            this.precedence = precedence;
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
