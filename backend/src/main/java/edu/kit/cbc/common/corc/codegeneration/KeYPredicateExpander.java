
package edu.kit.cbc.common.corc.codegeneration;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static edu.kit.cbc.common.corc.codegeneration.KeYPredicateParser.findMatching;

public final class KeYPredicateExpander {
    /**
     * This pattern matches every function syntax (e.g. exampleFunction())
     */
    private static final String FUNCTION_CALL_PATTERN = "(?<![\\\\\\w])([a-zA-Z_]\\w*)\\s*\\(";

    private final Map<String, KeYPredicateParser.PredicateDefinition>
            definitions = new HashMap<>();

    public KeYPredicateExpander(
            List<KeYPredicateParser.PredicateDefinition> predicates
    ) {
        for (var predicate : predicates) {
            definitions.put(predicate.name(), predicate);
        }
    }

    public String expand(String condition) {
        return expand(condition, new HashSet<>());
    }


    private String expand(
            String condition,
            Set<String> expansionStack
    ) {
        Pattern pattern = Pattern.compile(
                FUNCTION_CALL_PATTERN
        );

        Matcher matcher = pattern.matcher(condition);
        StringBuilder result = new StringBuilder();

        int position = 0;
        int searchPosition = 0;

        while (matcher.find(searchPosition)) {
            String name = matcher.group(1);
            var definition = definitions.get(name);

            // Skip unknown functions without looping forever.
            if (definition == null) {
                searchPosition = matcher.end();
                continue;
            }

            int open = condition.indexOf('(', matcher.start());
            int close = findMatching(condition, open, '(', ')');

            if (close < 0) {
                throw new IllegalArgumentException(
                        "Unclosed predicate call: " + name
                );
            }

            List<String> arguments = splitArguments(
                    condition.substring(open + 1, close)
            );

            if (arguments.size() != definition.parameterNames().size()) {
                throw new IllegalArgumentException(
                        "Wrong number of arguments for: " + name
                );
            }

            if (expansionStack.contains(name)) {
                throw new IllegalArgumentException(
                        "Recursive predicate: " + name
                );
            }

            String expression = definition.expression();

            if (expression == null) {
                throw new IllegalArgumentException(
                        "No replacement expression for: " + name
                );
            }

            Map<String, String> replacements = new HashMap<>();

            for (int i = 0; i < arguments.size(); i++) {
                replacements.put(
                        definition.parameterNames().get(i),
                        arguments.get(i).trim()
                );
            }

            expression = replaceParameters(expression, replacements);

            Set<String> nextStack = new HashSet<>(expansionStack);
            nextStack.add(name);

            expression = expand(expression, nextStack);
            expression = convertToJml(expression);

            result.append(condition, position, matcher.start());
            result.append("(").append(expression).append(")");

            position = close + 1;
            searchPosition = position;
        }

        result.append(condition.substring(position));

        return result.toString();
    }

    private static String replaceParameters(
            String expression,
            Map<String, String> replacements
    ) {
        Pattern pattern = Pattern.compile(
                "\\b[a-zA-Z_]\\w*\\b"
        );

        Matcher matcher = pattern.matcher(expression);
        StringBuffer result = new StringBuffer();

        while (matcher.find()) {
            String replacement = replacements.get(matcher.group());

            matcher.appendReplacement(
                    result,
                    Matcher.quoteReplacement(
                            replacement != null
                                    ? replacement
                                    : matcher.group()
                    )
            );
        }

        matcher.appendTail(result);
        return result.toString();
    }

    private static String convertToJml(String expression) {

        // Convert length(array) to (array).length.
        Pattern lengthPattern = Pattern.compile(
                "\\blength\\s*\\("
        );

        Matcher matcher = lengthPattern.matcher(expression);
        StringBuilder result = new StringBuilder();
        int position = 0;

        while (matcher.find(position)) {

            int open = expression.indexOf('(', matcher.start());
            int close = findMatching(expression, open, '(', ')');

            if (close < 0) {
                throw new IllegalArgumentException(
                        "Invalid length expression"
                );
            }

            String argument =
                    expression.substring(open + 1, close).trim();

            result.append(expression, position, matcher.start());
            result.append("(")
                    .append(argument)
                    .append(").length");

            position = close + 1;
        }

        result.append(expression.substring(position));
        expression = result.toString();

        // Logical operators
        expression = expression.replace("->", "==>");

        expression = expression.replaceAll(
                "(?<!&)&(?!&)", "&&"
        );

        expression = expression.replaceAll(
                "(?<!\\|)\\|(?!\\|)", "||"
        );

        // Equality operator
        expression = expression.replaceAll(
                "(?<![<>=!])=(?!=)", "=="
        );

        return expression;
    }

    private static List<String> splitArguments(String input) {

        List<String> arguments = new ArrayList<>();

        if (input.isBlank()) {
            return arguments;
        }

        int depth = 0;
        int start = 0;

        for (int i = 0; i < input.length(); i++) {

            char current = input.charAt(i);

            if (current == '(' || current == '[') {
                depth++;
            } else if (current == ')' || current == ']') {
                depth--;
            } else if (current == ',' && depth == 0) {
                arguments.add(
                        input.substring(start, i).trim()
                );
                start = i + 1;
            }
        }

        arguments.add(input.substring(start).trim());

        return arguments;
    }

    private static int findMatchingParenthesis(
            String input,
            int open
    ) {
        int depth = 0;

        for (int i = open; i < input.length(); i++) {

            if (input.charAt(i) == '(') {
                depth++;
            } else if (input.charAt(i) == ')') {
                depth--;

                if (depth == 0) {
                    return i;
                }
            }
        }

        return -1;
    }
}
