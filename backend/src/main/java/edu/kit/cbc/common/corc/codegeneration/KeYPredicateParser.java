
package edu.kit.cbc.common.corc.codegeneration;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses KeY include files and extracts predicate definitions.
 * Supports predicate declarations and rewrite rules containing
 * \find and \replacewith expressions.
 * Does not perform predicate expansion.
 */
public final class KeYPredicateParser {

    private KeYPredicateParser() {
        // Utility class
    }

    private static final Pattern PREDICATE_PATTERN =
            Pattern.compile(
                    "\\\\predicates\\s*\\{([^}]*)\\}",
                    Pattern.DOTALL
            );

    private static final Pattern DECLARATION_PATTERN =
            Pattern.compile(
                    "([a-zA-Z_]\\w*)\\s*\\(([^()]*)\\)\\s*;"
            );

    private static final Pattern RULE_PATTERN =
            Pattern.compile(
                    "([a-zA-Z_]\\w*)\\s*\\{"
            );

    /**
     * Represents a predicate definition extracted from a KeY file.
     *
     * @param name predicate name
     * @param parameterTypes declared parameter types
     * @param parameterNames parameter names from the find expression
     * @param expression replacement expression, or null if missing
     */
    public record PredicateDefinition(
            String name,
            List<String> parameterTypes,
            List<String> parameterNames,
            String expression
    ) {}

    /**
     * Internal representation of a rewrite rule.
     *
     * @param parameterNames formal parameter names
     * @param expression replacement expression
     */
    private record RewriteDefinition(
            List<String> parameterNames,
            String expression
    ) {}

    /**
     * Parses multiple KeY include files.
     *
     * @param includeFiles paths to KeY include files
     * @return extracted predicate definitions
     * @throws IOException if a file cannot be read
     */
    public static List<PredicateDefinition> parse(
            List<Path> includeFiles
    ) throws IOException {

        List<PredicateDefinition> predicates = new ArrayList<>();

        for (Path file : includeFiles) {
            String content = Files.readString(file);
            predicates.addAll(parseContent(content));
        }

        return predicates;
    }

    /**
     * Extracts predicate definitions from KeY source text.
     */
    private static List<PredicateDefinition> parseContent(
            String content
    ) {
        List<PredicateDefinition> result = new ArrayList<>();

        // 1. Extract predicate names and parameter types.
        Map<String, List<String>> predicateDeclarations =
                parseDeclarations(content);

        // 2. Extract parameter names and replacement expressions.
        Map<String, RewriteDefinition> replacements =
                parseReplacements(content);

        // 3. Combine declarations and rewrite rules.
        for (Map.Entry<String, List<String>> entry
                : predicateDeclarations.entrySet()) {

            String name = entry.getKey();
            List<String> parameterTypes = entry.getValue();

            RewriteDefinition rewrite = replacements.get(name);

            List<String> parameterNames =
                    rewrite != null
                            ? rewrite.parameterNames()
                            : List.of();

            String expression =
                    rewrite != null
                            ? rewrite.expression()
                            : null;

            // Validate parameter count if a rewrite rule exists.
            if (rewrite != null
                    && parameterTypes.size() != parameterNames.size()) {

                throw new IllegalArgumentException(
                        "Parameter count mismatch for predicate '"
                                + name + "': expected "
                                + parameterTypes.size()
                                + " but found "
                                + parameterNames.size()
                );
            }

            result.add(
                    new PredicateDefinition(
                            name,
                            parameterTypes,
                            parameterNames,
                            expression
                    )
            );
        }

        return result;
    }

    /**
     * Extracts predicate names and parameter types
     * from the \predicates blocks.
     */
    private static Map<String, List<String>> parseDeclarations(
            String content
    ) {
        Map<String, List<String>> declarations =
                new LinkedHashMap<>();

        Matcher declarationBlock =
                PREDICATE_PATTERN.matcher(content);

        while (declarationBlock.find()) {

            Matcher matcher = DECLARATION_PATTERN.matcher(
                    declarationBlock.group(1)
            );

            while (matcher.find()) {

                String name = matcher.group(1);
                String parameterString = matcher.group(2);

                List<String> parameterTypes =
                        Arrays.stream(parameterString.split(","))
                                .map(String::trim)
                                .filter(s -> !s.isEmpty())
                                .toList();

                declarations.put(name, parameterTypes);
            }
        }

        return declarations;
    }

    /**
     * Extracts parameter names and replacement expressions
     * from \rules blocks.
     */
    private static Map<String, RewriteDefinition> parseReplacements(
            String content
    ) {
        Map<String, RewriteDefinition> replacements =
                new LinkedHashMap<>();

        int rulesStart = content.indexOf("\\rules");

        if (rulesStart < 0) {
            return replacements;
        }

        int rulesOpen = content.indexOf('{', rulesStart);

        if (rulesOpen < 0) {
            return replacements;
        }

        int rulesClose = findMatching(
                content, rulesOpen, '{', '}'
        );

        if (rulesClose < 0) {
            return replacements;
        }

        String rulesContent = content.substring(
                rulesOpen + 1, rulesClose
        );

        Matcher ruleMatcher = RULE_PATTERN.matcher(rulesContent);

        int position = 0;

        while (ruleMatcher.find(position)) {

            String ruleName = ruleMatcher.group(1);

            int ruleOpen = rulesContent.indexOf(
                    '{', ruleMatcher.start()
            );

            int ruleClose = findMatching(
                    rulesContent, ruleOpen, '{', '}'
            );

            if (ruleClose < 0) {
                break;
            }

            String ruleContent = rulesContent.substring(
                    ruleOpen + 1, ruleClose
            );

            // Extract \find(...)
            String findExpression =
                    extractExpression(ruleContent, "\\find");

            // Extract \replacewith(...)
            String replacementExpression =
                    extractExpression(ruleContent, "\\replacewith");

            if (findExpression != null
                    && replacementExpression != null) {

                String predicateName =
                        extractPredicateName(findExpression);

                if (ruleName.equals(predicateName)) {

                    // Extract parameter names from \find(...)
                    List<String> parameterNames =
                            extractParameterNames(findExpression);

                    replacements.put(
                            predicateName,
                            new RewriteDefinition(
                                    parameterNames,
                                    replacementExpression
                            )
                    );
                }
            }

            position = ruleClose + 1;
        }

        return replacements;
    }

    /**
     * Extracts the argument of a KeY command such as
     * \find(...) or \replacewith(...).
     */
    private static String extractExpression(
            String content,
            String command
    ) {
        int start = content.indexOf(command);

        if (start < 0) {
            return null;
        }

        int open = content.indexOf(
                '(', start + command.length()
        );

        if (open < 0) {
            return null;
        }

        int close = findMatching(
                content, open, '(', ')'
        );

        if (close < 0) {
            return null;
        }

        return content.substring(open + 1, close).trim();
    }

    /**
     * Extracts the predicate name from a find expression.
     * Example:
     * containsOldElements(list, oldList)
     * -> containsOldElements
     */
    private static String extractPredicateName(
            String findExpression
    ) {
        int index = findExpression.indexOf('(');

        if (index < 0) {
            return findExpression.trim();
        }

        return findExpression.substring(0, index).trim();
    }

    /**
     * Extracts formal parameter names from a find expression.
     * Example:
     * containsOldElements(list, oldList)
     * -> ["list", "oldList"]
     */
    private static List<String> extractParameterNames(
            String findExpression
    ) {
        int open = findExpression.indexOf('(');

        if (open < 0) {
            return List.of();
        }

        int close = findMatching(
                findExpression, open, '(', ')'
        );

        if (close < 0) {
            return List.of();
        }

        String parameterString = findExpression.substring(
                open + 1, close
        );

        if (parameterString.isBlank()) {
            return List.of();
        }

        return Arrays.stream(parameterString.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    /**
     * Finds the matching closing delimiter.
     * Supports nested delimiters of the same type.
     */
    public static int findMatching(
            String content,
            int openIndex,
            char opening,
            char closing
    ) {
        if (openIndex < 0
                || openIndex >= content.length()
                || content.charAt(openIndex) != opening) {
            return -1;
        }

        int depth = 0;

        for (int i = openIndex; i < content.length(); i++) {

            char current = content.charAt(i);

            if (current == opening) {
                depth++;
            } else if (current == closing) {
                depth--;

                if (depth == 0) {
                    return i;
                }
            }
        }

        return -1;
    }
}
