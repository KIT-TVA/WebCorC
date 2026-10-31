package edu.kit.cbc.common.corc.parsing;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariableKind;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * {@link SemanticChecker#checkTree}'s identifier walk against an arbitrary scope — the reused
 * primitive both {@link SemanticChecker#checkVariables} (a formula's functional conditions) and
 * a Verifier's own scope check build on — and {@link SemanticChecker#javaVariableNames}, the
 * program-variable extraction both share.
 */
class SemanticCheckerTest {

    private static Tree tree(String expression) {
        return Condition.fromString(expression).getParsedCondition();
    }

    private static void assertInScope(String expression, Set<String> scope) {
        Assertions.assertDoesNotThrow(() -> SemanticChecker.checkTree(tree(expression), scope), expression);
    }

    private static void assertOutOfScope(String expression, Set<String> scope, String offender) {
        SemanticException e = Assertions.assertThrows(SemanticException.class,
            () -> SemanticChecker.checkTree(tree(expression), scope), expression);
        Assertions.assertTrue(e.getMessage().contains("'" + offender + "'"), e.getMessage());
    }

    @Test
    void aScopedIdentifierUsedPlainlyIsInScope() {
        assertInScope("energyBudget == 5", Set.of("energyBudget"));
    }

    @Test
    void oldOfAScopedIdentifierIsInScope() {
        assertInScope("\\old(energyBudget) == 5", Set.of("energyBudget"));
    }

    @Test
    void twoScopedIdentifiersMayBeComparedWithEachOther() {
        assertInScope("energyBudget == energyPrevious", Set.of("energyBudget", "energyPrevious"));
    }

    @Test
    void theLiteralsTrueFalseNullNeedNoDeclaration() {
        assertInScope("true && false ==> (energyBudget == null)", Set.of("energyBudget"));
    }

    @Test
    void anIdentifierOutsideTheScopeIsRejected() {
        assertOutOfScope("sec == 1", Set.of("energyBudget"), "sec");
    }

    @Test
    void oldOfAnOutOfScopeIdentifierIsStillRejected() {
        assertOutOfScope("\\old(sec) == 1", Set.of("energyBudget"), "sec");
    }

    @Test
    void aQuantifierBinderIsInScopeOnlyInsideItsOwnCondition() {
        assertInScope("\\forall int k; (k == 0)", Set.of());
    }

    @Test
    void anEmptyScopeAcceptsALiteralButRejectsAnIdentifier() {
        assertInScope("true", Set.of());
        assertOutOfScope("energyBudget == 1", Set.of(), "energyBudget");
    }

    @Test
    void javaVariableNamesStripsTheDeclaredTypeAndArrayBrackets() {
        CbCFormula formula = new CbCFormula();
        formula.setJavaVariables(List.of(
            new JavaVariable("int i", JavaVariableKind.LOCAL),
            new JavaVariable("int[] items", JavaVariableKind.GLOBAL)));

        Assertions.assertEquals(Set.of("i", "items"), SemanticChecker.javaVariableNames(formula));
    }

    @Test
    void javaVariableNamesIsEmptyWithoutDeclaredVariables() {
        Assertions.assertEquals(Set.of(), SemanticChecker.javaVariableNames(new CbCFormula()));
    }
}
