package edu.kit.cbc.editor.verifier.job;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.VerifierEntry;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.CompositionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.ReturnStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SelectionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SmallRepetitionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.Statement;
import edu.kit.cbc.editor.verifier.ResolvedVerifier;
import edu.kit.cbc.editor.verifier.VerifierCatalogService;
import io.micronaut.json.JsonMapper;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 * The narrowed program a Verifier receives, built from the job's formula: every statement gets
 * a stable id, the receiving Verifier's own Verifier Conditions are swapped into the primary
 * condition fields (absent where none is written), the program's code (program text, guards) and
 * its loops' invariants and variants are carried unchanged while the rest of its functional
 * specification is left out, and a Verifier's flat
 * result merges back into the same statements by those ids.
 */
class NarrowedProgramTest {

    /** Every statement kind once: composition(statement, repetition(selection(statement, skip))). */
    private static final String FORMULA_JSON = """
        {
          "name": "Demo",
          "javaVariables": [{"name": "int x", "kind": "LOCAL"}, {"name": "int total", "kind": "GLOBAL"}],
          "globalConditions": [{"condition": "total >= 0"}],
          "renamings": [],
          "isProven": false,
          "verifiers": {
            "energy": {"preCondition": {"condition": "energy == 0"}, "postCondition": {"condition": "energy <= budget"}}
          },
          "statement": {
            "name": "Comp", "type": "COMPOSITION", "isProven": false,
            "preCondition": {"condition": "x == 0"}, "postCondition": {"condition": "x == 10"},
            "intermediateCondition": {"condition": "x == 1"},
            "verifiers": {
              "energy": {
                "preCondition": {"condition": "energy == 0"}, "postCondition": {"condition": "energy <= budget"},
                "intermediateCondition": {"condition": "energy <= 1"}
              },
              "sec": {"preCondition": {"condition": "safe(x)"}, "postCondition": {"condition": "safe(x)"}}
            },
            "firstStatement": {
              "name": "Assign", "type": "STATEMENT", "isProven": false, "programStatement": "x = 1;",
              "preCondition": {"condition": "x == 0"}, "postCondition": {"condition": "x == 1"},
              "verifiers": {"energy": {"preCondition": {"condition": "energy == 0"}, "postCondition": {"condition": "energy <= 1"}}}
            },
            "secondStatement": {
              "name": "Loop", "type": "REPETITION", "isProven": false,
              "preCondition": {"condition": "x == 1"}, "postCondition": {"condition": "x == 10"},
              "variant": {"condition": "10 - x"}, "invariant": {"condition": "x <= 10"}, "guard": {"condition": "x < 10"},
              "loopStatement": {
                "name": "Branch", "type": "SELECTION", "isProven": false,
                "preCondition": {"condition": "x < 10"}, "postCondition": {"condition": "x <= 10"},
                "guards": [{"condition": "x < 5"}, {"condition": "x >= 5"}],
                "commands": [
                  {
                    "name": "Step", "type": "STATEMENT", "isProven": false, "programStatement": "x = x + 1;",
                    "preCondition": {"condition": "x < 5"}, "postCondition": {"condition": "x <= 10"}
                  },
                  {
                    "name": "Rest", "type": "SKIP", "isProven": false,
                    "preCondition": {"condition": "x >= 5"}, "postCondition": {"condition": "x <= 10"},
                    "verifiers": {"energy": {"preCondition": {"condition": "energy <= 1"}, "postCondition": {"condition": "energy <= 1"}}}
                  }
                ]
              }
            }
          }
        }
        """;

    private static CbCFormula formula() throws Exception {
        return new ObjectMapper().readValue(FORMULA_JSON, CbCFormula.class);
    }

    /** A condition as the backend prints it. */
    private static JobCondition condition(String content) {
        return new JobCondition(Condition.fromString(content).getCondition());
    }

    /** Verifiers about to run, none of them with a settings stamp. */
    private static List<ResolvedVerifier> running(String... ids) {
        return Stream.of(ids).map(id -> stamped(id, null)).toList();
    }

    private static ResolvedVerifier stamped(String id, Long settingsUpdatedAt) {
        return new ResolvedVerifier(id, Map.of(), settingsUpdatedAt);
    }

    /** "Step", the fixture's statement with no verifiers entry of its own. */
    private static AbstractStatement step(CbCFormula formula) {
        return ((SelectionStatement) ((SmallRepetitionStatement)
            ((CompositionStatement) formula.getStatement()).getSecondStatement()).getLoopStatement()).getCommands().get(0);
    }

    @Test
    void swapsTheVerifiersOwnConditionsIntoTheNarrowedTree() throws Exception {
        NarrowedProgram program = NarrowedProgram.of(formula());

        JobProgram energy = program.forVerifier("energy");

        JobStatement expected = JobStatement.composition(1, "Comp",
            condition("energy == 0"), condition("energy <= budget"), condition("energy <= 1"),
            JobStatement.statement(2, "Assign", condition("energy == 0"), condition("energy <= 1"), "x = 1;"),
            JobStatement.repetition(3, "Loop", null, null, condition("x < 10"),
                condition("x <= 10"), condition("10 - x"),
                JobStatement.selection(4, "Branch", null, null,
                    List.of(condition("x < 5"), condition("x >= 5")),
                    List.of(
                        JobStatement.statement(5, "Step", null, null, "x = x + 1;"),
                        JobStatement.skip(6, "Rest", condition("energy <= 1"), condition("energy <= 1"))))));
        Assertions.assertEquals(new JobProgram("Demo", List.of("int x", "int total"),
            condition("energy == 0"), condition("energy <= budget"), expected), energy);
    }

    @Test
    void aStatementCarriesItsProgramTextAndASkipIsItsOwnKind() throws Exception {
        NarrowedProgram program = NarrowedProgram.of(formula());

        JobStatement root = program.forVerifier("energy").statement();

        JobStatement assign = root.firstStatement();
        Assertions.assertEquals(JobStatement.STATEMENT, assign.type());
        Assertions.assertEquals("x = 1;", assign.programStatement());
        JobStatement rest = root.secondStatement().loopStatement().commands().get(1);
        Assertions.assertEquals(JobStatement.SKIP, rest.type(), "A skip is SKIP, not STATEMENT");
        Assertions.assertNull(rest.programStatement(), "A skip has no program text");
    }

    @Test
    void aStatementWithoutProgramTextStillCarriesTheRequiredField() throws Exception {
        CbCFormula formula = formula();
        ((CompositionStatement) formula.getStatement()).setFirstStatement(new Statement());

        JobStatement first = NarrowedProgram.of(formula).forVerifier("energy").statement().firstStatement();

        Assertions.assertEquals("", first.programStatement(), "programStatement is required on the wire");
    }

    @Test
    void aStatementKindWithoutAJobKindIsRefusedRatherThanSentAsAnotherKind() throws Exception {
        CbCFormula formula = formula();
        ((CompositionStatement) formula.getStatement()).setFirstStatement(new ReturnStatement());

        Assertions.assertThrows(IllegalArgumentException.class, () -> NarrowedProgram.of(formula).forVerifier("energy"));
    }

    @Test
    void theJobCarriesTheProgramInTheModelsShape() throws Exception {
        NarrowedProgram program = NarrowedProgram.of(formula());

        String json = JsonMapper.createDefault().writeValueAsString(program.forVerifier("maint"));
        JsonNode wire = new ObjectMapper().readTree(json);

        Assertions.assertEquals(Set.of("name", "javaVariables", "statement"), fieldNames(wire),
            "No className, methodName, globalConditions; no Root conditions for a Verifier that wrote none: " + json);
        JsonNode comp = wire.get("statement");
        Assertions.assertEquals(Set.of("id", "name", "type", "firstStatement", "secondStatement"), fieldNames(comp), json);
        Assertions.assertEquals("COMPOSITION", comp.get("type").asText());
        JsonNode loop = comp.get("secondStatement");
        Assertions.assertEquals(Set.of("id", "name", "type", "guard", "invariant", "variant", "loopStatement"),
            fieldNames(loop), json);
        Assertions.assertEquals("REPETITION", loop.get("type").asText());
        Assertions.assertEquals(new ObjectMapper().createObjectNode().put("condition", condition("x < 10").condition()),
            loop.get("guard"), "A guard is the model's {condition}");
        Assertions.assertEquals(new ObjectMapper().createObjectNode().put("condition", "x <= 10"), loop.get("invariant"), json);
        Assertions.assertEquals(new ObjectMapper().createObjectNode().put("condition", "10 - x"), loop.get("variant"), json);
        JsonNode branch = loop.get("loopStatement");
        Assertions.assertEquals(Set.of("id", "name", "type", "guards", "commands"), fieldNames(branch), json);
        Assertions.assertEquals("SELECTION", branch.get("type").asText());
        Assertions.assertEquals(Set.of("condition"), fieldNames(branch.get("guards").get(0)));
        JsonNode step = branch.get("commands").get(0);
        Assertions.assertEquals(Set.of("id", "name", "type", "programStatement"), fieldNames(step), json);
        Assertions.assertEquals("STATEMENT", step.get("type").asText());
        JsonNode rest = branch.get("commands").get(1);
        Assertions.assertEquals(Set.of("id", "name", "type"), fieldNames(rest), json);
        Assertions.assertEquals("SKIP", rest.get("type").asText());
    }

    @Test
    void theReceivingVerifiersOwnConditionsAreSentAsConditionObjects() throws Exception {
        NarrowedProgram program = NarrowedProgram.of(formula());

        String json = JsonMapper.createDefault().writeValueAsString(program.forVerifier("energy"));
        JsonNode wire = new ObjectMapper().readTree(json);

        Assertions.assertEquals(Set.of("condition"), fieldNames(wire.get("preCondition")), json);
        Assertions.assertEquals(Set.of("condition"), fieldNames(wire.get("statement").get("intermediateCondition")), json);
    }

    private static Set<String> fieldNames(JsonNode node) {
        Set<String> names = new HashSet<>();
        node.fieldNames().forEachRemaining(names::add);
        return names;
    }

    @Test
    void aVerifierWithoutAnyConditionsStillGetsTheWholeProgram() throws Exception {
        NarrowedProgram program = NarrowedProgram.of(formula());

        JobProgram bare = program.forVerifier("maint");

        Assertions.assertNull(bare.preCondition());
        Assertions.assertNull(bare.postCondition());
        JobStatement root = bare.statement();
        Assertions.assertEquals(JobStatement.COMPOSITION, root.type());
        Assertions.assertNull(root.preCondition());
        Assertions.assertNull(root.intermediateCondition());
        Assertions.assertEquals(2, root.firstStatement().id());
        Assertions.assertEquals(condition("x < 10"), root.secondStatement().guard(),
            "The program's own control flow is the same for every Verifier");
        Assertions.assertEquals(condition("x <= 10"), root.secondStatement().invariant(),
            "The loop's own invariant is the same for every Verifier");
        Assertions.assertEquals(condition("10 - x"), root.secondStatement().variant(),
            "The loop's own variant is the same for every Verifier");
        Assertions.assertEquals(List.of(condition("x < 5"), condition("x >= 5")),
            root.secondStatement().loopStatement().guards());
        Assertions.assertEquals(List.of("int x", "int total"), bare.javaVariables());
    }

    @Test
    void onlyTheReceivingVerifiersConditionsAreSwappedIn() throws Exception {
        NarrowedProgram program = NarrowedProgram.of(formula());

        JobStatement root = program.forVerifier("sec").statement();

        Assertions.assertEquals(condition("safe(x)"), root.preCondition());
        Assertions.assertNull(root.intermediateCondition(), "sec wrote no intermediate condition");
        Assertions.assertNull(root.firstStatement().preCondition(), "energy's condition on Assign is not sec's");
    }

    @Test
    void idsAreAssignedInPreorderAndAreTheSameForEveryVerifier() throws Exception {
        NarrowedProgram program = NarrowedProgram.of(formula());

        Assertions.assertEquals(List.of(1L, 2L, 3L, 4L, 5L, 6L), program.statementIds());
        Assertions.assertEquals(ids(program.forVerifier("energy").statement()), ids(program.forVerifier("sec").statement()));
    }

    private static List<Long> ids(JobStatement statement) {
        return switch (statement.type()) {
            case JobStatement.COMPOSITION -> concat(statement.id(), ids(statement.firstStatement()), ids(statement.secondStatement()));
            case JobStatement.REPETITION -> concat(statement.id(), ids(statement.loopStatement()), List.of());
            case JobStatement.SELECTION -> concat(statement.id(),
                statement.commands().stream().flatMap(s -> ids(s).stream()).toList(), List.of());
            default -> List.of(statement.id());
        };
    }

    private static List<Long> concat(long id, List<Long> first, List<Long> second) {
        return Stream.of(List.of(id), first, second).flatMap(List::stream).toList();
    }

    @Test
    void mergesAResultIntoTheStatementsVerifiersEntriesKeepingTheirConditions() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);

        program.merge("energy", Map.of(
            "1", new StatementResult(true, "3.2 J"),
            "2", new StatementResult(false, null),
            "5", new StatementResult(true, "0.1 J")));

        CompositionStatement root = (CompositionStatement) formula.getStatement();
        VerifierEntry rootEntry = root.getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.TRUE, rootEntry.proven());
        Assertions.assertEquals("3.2 J", rootEntry.status());
        Assertions.assertEquals("energy == 0", rootEntry.preCondition().getCondition(), "The authored condition survives");
        Assertions.assertEquals("energy <= 1", rootEntry.intermediateCondition().getCondition());
        Assertions.assertNull(root.getVerifiers().get("sec").proven(), "Another Verifier's entry is untouched");

        VerifierEntry assign = root.getFirstStatement().getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.FALSE, assign.proven());
        Assertions.assertNull(assign.status(), "A Verifier with nothing to say leaves the status absent");

        SmallRepetitionStatement loop = (SmallRepetitionStatement) root.getSecondStatement();
        Assertions.assertNull(loop.getVerifiers(), "No result for the loop: nothing is invented");
        AbstractStatement step = ((SelectionStatement) loop.getLoopStatement()).getCommands().get(0);
        VerifierEntry stepEntry = step.getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.TRUE, stepEntry.proven(), "A result is recorded even where no condition was written");
        Assertions.assertEquals("0.1 J", stepEntry.status());
        Assertions.assertNull(stepEntry.preCondition());
        Assertions.assertFalse(formula.isProven(), "The Functional Verifier's own verdict is untouched");
    }

    @Test
    void ignoresResultEntriesForIdsTheProgramDoesNotHave() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);

        program.merge("energy", Map.of("42", new StatementResult(true, null), "root", new StatementResult(true, null)));

        Assertions.assertNull(formula.getStatement().getVerifiers().get("energy").proven());
        Assertions.assertNull(formula.getStatement().getVerifiers().get("energy").status());
    }

    @Test
    void mergeClearsAStaleStatusWhenTheVerifierReportsNone() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        program.merge("energy", Map.of("1", new StatementResult(true, "stale reading")));
        Assertions.assertEquals("stale reading", formula.getStatement().getVerifiers().get("energy").status());

        program.merge("energy", Map.of("1", new StatementResult(true, null)));

        Assertions.assertNull(formula.getStatement().getVerifiers().get("energy").status(),
            "A later merge with no status text overwrites, rather than keeps, the previous one");
    }

    @Test
    void resetForRunClearsEnabledAndMarksDisabledPreservingConditionsAndCreatingMissingEntries() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);

        program.resetForRun(running("energy"), List.of("sec"));

        CompositionStatement top = (CompositionStatement) formula.getStatement();
        VerifierEntry energy = top.getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.FALSE, energy.proven());
        Assertions.assertNull(energy.status(), "An enabled Verifier's status is cleared, ready for its own report");
        Assertions.assertNull(energy.disabled(), "An enabled Verifier is about to run: no disabled marker");
        Assertions.assertEquals("energy == 0", energy.preCondition().getCondition(), "The authored condition survives the reset");
        Assertions.assertEquals("energy <= 1", energy.intermediateCondition().getCondition());

        VerifierEntry sec = top.getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, sec.proven());
        Assertions.assertEquals(Boolean.TRUE, sec.disabled(), "sec did not run: that is a field, not a text");
        Assertions.assertNull(sec.status(), "A disabled entry carries no status of WebCorC's invention");
        Assertions.assertEquals("safe(x)", sec.preCondition().getCondition(), "The authored condition survives the reset");
    }

    @Test
    void resetForRunWritesTheRootsOwnEntriesTheSameWayAsAStatementsBoth() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);

        program.resetForRun(running("energy"), List.of("sec"));

        VerifierEntry rootEnergy = formula.getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.FALSE, rootEnergy.proven());
        Assertions.assertNull(rootEnergy.disabled());
        Assertions.assertEquals("energy == 0", rootEnergy.preCondition().getCondition(),
            "The Root's authored condition survives the reset");

        VerifierEntry rootSec = formula.getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, rootSec.proven(), "The Root gets an entry even where none was authored");
        Assertions.assertEquals(Boolean.TRUE, rootSec.disabled());
        Assertions.assertNull(rootSec.status());
    }

    @Test
    void resetForRunCreatesAnEntryWhereNoneExisted() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        AbstractStatement step = step(formula);
        Assertions.assertNull(step.getVerifiers(), "Step has no verifiers entry at all in the fixture");

        program.resetForRun(running("sec"), List.of("energy"));

        VerifierEntry stepSec = step.getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, stepSec.proven());
        Assertions.assertNull(stepSec.status(), "sec is enabled: status cleared");
        Assertions.assertNull(stepSec.disabled());
        Assertions.assertNull(stepSec.preCondition(), "No condition was ever authored for sec on Step");

        VerifierEntry stepEnergy = step.getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.FALSE, stepEnergy.proven());
        Assertions.assertEquals(Boolean.TRUE, stepEnergy.disabled());
        Assertions.assertNull(stepEnergy.status());
    }

    @Test
    void resetForRunClearsAStaleStatusAndAStaleDisabledMarker() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        program.resetForRun(running(), List.of("energy"));
        program.markFailed("sec", "did not finish: gave up");

        program.resetForRun(running("energy", "sec"), List.of());

        VerifierEntry energy = formula.getStatement().getVerifiers().get("energy");
        Assertions.assertNull(energy.disabled(), "energy is enabled this run: last run's disabled marker is gone");
        VerifierEntry sec = formula.getVerifiers().get("sec");
        Assertions.assertEquals(Boolean.FALSE, sec.proven());
        Assertions.assertNull(sec.status(), "The Root's stale failure reason from the last run is cleared too");
    }

    @Test
    void resetForRunNeverTouchesFuncEvenIfPassedIn() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);

        program.resetForRun(running(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID), List.of(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID));

        Assertions.assertNull(formula.getStatement().getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID),
            "func is never written by the reset, enabled or disabled");
        Assertions.assertNull(formula.getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID),
            "nor on the Root, whose func entry has its own writer");
    }

    @Test
    void markFailedSetsEveryStatementsAndTheRootsEntryProvenFalseWithTheReasonAsStatus() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);

        program.markFailed("energy", "could not be started: Connection refused");

        CompositionStatement top = (CompositionStatement) formula.getStatement();
        VerifierEntry topEntry = top.getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.FALSE, topEntry.proven());
        Assertions.assertEquals("could not be started: Connection refused", topEntry.status());
        Assertions.assertNull(topEntry.disabled(), "Failed outright is a failure, not a Verifier that did not run");
        Assertions.assertEquals("energy == 0", topEntry.preCondition().getCondition(), "The authored condition survives");

        AbstractStatement step = ((SelectionStatement) ((SmallRepetitionStatement) top.getSecondStatement()).getLoopStatement())
            .getCommands().get(0);
        VerifierEntry stepEntry = step.getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.FALSE, stepEntry.proven(), "Every statement gets the entry, not just the ones with a condition");
        Assertions.assertEquals("could not be started: Connection refused", stepEntry.status());

        VerifierEntry rootEntry = formula.getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.FALSE, rootEntry.proven(), "A Verifier that could not run failed for the Root too");
        Assertions.assertEquals("could not be started: Connection refused", rootEntry.status());
        Assertions.assertNull(rootEntry.disabled());
        Assertions.assertEquals("energy == 0", rootEntry.preCondition().getCondition(),
            "The Root's authored condition survives the failure marking");

        Assertions.assertNull(top.getVerifiers().get("sec").proven(), "An unrelated Verifier's entry is untouched");
        Assertions.assertNull(formula.getVerifiers().get("sec"), "Nor is one invented for it on the Root");
    }

    @Test
    void markFailedNeverTouchesFunc() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);

        program.markFailed(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID, "could not be started: unreachable");

        Assertions.assertNull(formula.getStatement().getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID));
        Assertions.assertNull(formula.getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID));
    }

    @Test
    void writeRootResultWritesThatVerifiersWholeRunVerdictOntoTheRootAlone() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        program.resetForRun(running("energy", "sec"), List.of());

        program.writeRootResult("energy", true, "3.2 J for the whole run");

        VerifierEntry rootEnergy = formula.getVerifiers().get("energy");
        Assertions.assertEquals(Boolean.TRUE, rootEnergy.proven());
        Assertions.assertEquals("3.2 J for the whole run", rootEnergy.status());
        Assertions.assertNull(rootEnergy.disabled());
        Assertions.assertEquals("energy == 0", rootEnergy.preCondition().getCondition(), "The authored condition survives");
        Assertions.assertEquals(Boolean.FALSE, formula.getVerifiers().get("sec").proven(),
            "Another Verifier's Root entry is untouched");
        Assertions.assertEquals(Boolean.FALSE, formula.getStatement().getVerifiers().get("energy").proven(),
            "The statements keep what the Verifier's own per-statement result says, here still the reset default");
    }

    @Test
    void writeRootResultWithoutAStatusLeavesTheRootEntryWithout() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        program.markFailed("energy", "did not finish: gave up");

        program.writeRootResult("energy", false, null);

        Assertions.assertNull(formula.getVerifiers().get("energy").status(),
            "A Verifier with nothing to say about the run leaves the Root's status absent");
    }

    @Test
    void writeRootResultNeverTouchesFunc() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);

        program.writeRootResult(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID, true, "whatever");

        Assertions.assertNull(formula.getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID),
            "func's Root entry has its own writer and never a status");
    }

    @Test
    void theDisabledMarkerIsSerialisedOnlyWhereItIsSet() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        program.resetForRun(running("energy"), List.of("sec"));
        ObjectMapper mapper = new ObjectMapper();

        String enabled = mapper.writeValueAsString(formula.getVerifiers().get("energy"));
        String disabled = mapper.writeValueAsString(formula.getVerifiers().get("sec"));

        Assertions.assertFalse(enabled.contains("\"disabled\""), "Absent, not false, on a Verifier that ran: " + enabled);
        Assertions.assertTrue(disabled.contains("\"disabled\":true"), disabled);
    }

    @Test
    void writeFunctionalResultWritesFuncFromEachStatementsOwnIsProvenNoStatusNoConditions() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        CompositionStatement root = (CompositionStatement) formula.getStatement();
        root.setProven(true);
        // Assign, Loop, Branch, Step and Rest all stay unproven (false), as in the fixture.

        program.writeFunctionalResult();

        VerifierEntry rootFunc = root.getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID);
        Assertions.assertEquals(Boolean.TRUE, rootFunc.proven());
        Assertions.assertNull(rootFunc.status(), "func never carries a status");
        Assertions.assertNull(rootFunc.preCondition(), "func never carries a condition");
        Assertions.assertEquals("energy == 0", root.getVerifiers().get("energy").preCondition().getCondition(),
            "An existing entry for another Verifier survives alongside the new func entry");

        VerifierEntry assignFunc = root.getFirstStatement().getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID);
        Assertions.assertEquals(Boolean.FALSE, assignFunc.proven(), "Each statement's own isProven, not the root's");
    }

    @Test
    void writeFormulaFunctionalResultWritesFuncOntoTheFormulasOwnRootVerifiersMapPreservingOthers() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        formula.setProven(true);

        program.writeFormulaFunctionalResult();

        VerifierEntry funcEntry = formula.getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID);
        Assertions.assertEquals(Boolean.TRUE, funcEntry.proven());
        Assertions.assertNull(funcEntry.status());
        Assertions.assertEquals("energy == 0", formula.getVerifiers().get("energy").preCondition().getCondition(),
            "The formula's own pre-existing root-level entry for another Verifier survives");
    }

    @Test
    void recomputeIsProvenWithNoEnabledVerifiersReducesToFunc() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        formula.getStatement().setProven(true);
        program.writeFunctionalResult();

        program.recomputeIsProven(List.of());

        Assertions.assertTrue(formula.getStatement().isProven());
        Assertions.assertTrue(formula.isProven(), "The formula mirrors the top-level statement's recomputed result");
    }

    @Test
    void recomputeIsProvenUsesACompositesOwnEntriesWithNoRollUpFromItsChildren() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        CompositionStatement root = (CompositionStatement) formula.getStatement();
        root.setProven(true);
        root.getFirstStatement().setProven(true); // "Assign", functionally proven too

        program.writeFunctionalResult();
        program.resetForRun(running("energy"), List.of());
        // The Verifier never reports a result for the composite itself (id 1), only for its child (id 2).
        program.merge("energy", Map.of("2", new StatementResult(true, null)));

        program.recomputeIsProven(List.of("energy"));

        Assertions.assertFalse(root.isProven(),
            "The composite's own energy entry is still the reset default (false); its proven child does not roll up");
        Assertions.assertTrue(root.getFirstStatement().isProven(), "Assign has both its own func and energy entries proven");
    }

    @Test
    void recomputeIsProvenIsFalseWhenAnEnabledVerifierFailed() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        formula.getStatement().setProven(true);
        program.writeFunctionalResult();
        program.resetForRun(running("energy"), List.of());
        program.markFailed("energy", "could not be started: Connection refused");

        program.recomputeIsProven(List.of("energy"));

        Assertions.assertFalse(formula.getStatement().isProven(),
            "func.proven is true but the enabled Verifier's own entry is proven:false");
    }

    // --- Settings stamp -----------------------------------------------------------------------

    @Test
    void resetForRunStampsEnabledEntriesOnStatementsAndRootAndRemovesTheStampTheRequestCarriedOnDisabledOnes() throws Exception {
        CbCFormula formula = formula();
        // The frontend sends its old entries back: sec's still carries the stamp of an earlier run.
        formula.getStatement().getVerifiers().put("sec", new VerifierEntry(null, null, null, true, null, null, 5L));
        formula.getVerifiers().put("sec", new VerifierEntry(null, null, null, true, null, null, 5L));
        NarrowedProgram program = NarrowedProgram.of(formula);

        program.resetForRun(List.of(stamped("energy", 7L)), List.of("sec"));

        Assertions.assertEquals(7L, formula.getStatement().getVerifiers().get("energy").settingsUpdatedAt());
        Assertions.assertEquals(7L, step(formula).getVerifiers().get("energy").settingsUpdatedAt(),
            "Every statement, not just the ones with a condition");
        Assertions.assertEquals(7L, formula.getVerifiers().get("energy").settingsUpdatedAt(), "The Root too");
        Assertions.assertNull(formula.getStatement().getVerifiers().get("sec").settingsUpdatedAt(),
            "A disabled entry never carries a stamp");
        Assertions.assertNull(formula.getVerifiers().get("sec").settingsUpdatedAt());
    }

    @Test
    void mergeWriteRootResultAndMarkFailedStampTheEntriesTheyWrite() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        program.resetForRun(List.of(stamped("energy", 7L), stamped("sec", 9L)), List.of());

        program.merge("energy", Map.of("5", new StatementResult(true, null)));
        program.writeRootResult("energy", true, null);
        program.markFailed("sec", "could not be started: Connection refused");

        Assertions.assertEquals(7L, step(formula).getVerifiers().get("energy").settingsUpdatedAt());
        Assertions.assertEquals(7L, formula.getVerifiers().get("energy").settingsUpdatedAt());
        Assertions.assertEquals(9L, step(formula).getVerifiers().get("sec").settingsUpdatedAt(),
            "A Verifier that failed to start failed under those settings");
        Assertions.assertEquals(9L, formula.getVerifiers().get("sec").settingsUpdatedAt());
    }

    @Test
    void theFunctionalVerifiersEntriesNeverCarryAStamp() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        program.resetForRun(List.of(stamped(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID, 3L)), List.of());

        program.writeFunctionalResult();
        program.writeFormulaFunctionalResult();

        Assertions.assertNull(formula.getStatement().getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID).settingsUpdatedAt());
        Assertions.assertNull(formula.getVerifiers().get(VerifierCatalogService.FUNCTIONAL_VERIFIER_ID).settingsUpdatedAt());
    }

    @Test
    void theStampIsSerialisedVerbatimAndOnlyWhereItIsSet() throws Exception {
        CbCFormula formula = formula();
        NarrowedProgram program = NarrowedProgram.of(formula);
        program.resetForRun(List.of(stamped("energy", 1727000000000L)), List.of("sec"));
        ObjectMapper mapper = new ObjectMapper();

        String enabled = mapper.writeValueAsString(formula.getVerifiers().get("energy"));
        String disabled = mapper.writeValueAsString(formula.getVerifiers().get("sec"));

        Assertions.assertTrue(enabled.contains("\"settingsUpdatedAt\":1727000000000"), enabled);
        Assertions.assertFalse(disabled.contains("settingsUpdatedAt"), disabled);
    }

    // --- Verifier Condition scope --------------------------------------------------------------

    /** "mock" declares one Variable, "energyBudget"; javaVariables declares "i". */
    private static final String SCOPE_FORMULA_JSON = """
        {
          "name": "Demo", "javaVariables": [{"name": "int i", "kind": "LOCAL"}], "globalConditions": [], "renamings": [], "isProven": false,
          "verifiers": {"mock": {"preCondition": {"condition": "energyBudget == 0"}}},
          "statement": {
            "name": "Comp", "type": "COMPOSITION", "isProven": false,
            "preCondition": {"condition": "x == 0"}, "postCondition": {"condition": "x == 2"},
            "verifiers": {
              "mock": {"postCondition": {"condition": "energyBudget == 1"}, "intermediateCondition": {"condition": "energyBudget <= 1"}}
            },
            "firstStatement": {
              "name": "First", "type": "STATEMENT", "isProven": false, "programStatement": "x = 1;",
              "preCondition": {"condition": "x == 0"}, "postCondition": {"condition": "x == 1"}
            },
            "secondStatement": {
              "name": "Second", "type": "STATEMENT", "isProven": false, "programStatement": "x = 2;",
              "preCondition": {"condition": "x == 1"}, "postCondition": {"condition": "x == 2"}
            }
          }
        }
        """;

    private static CbCFormula scopeFormula() throws Exception {
        return new ObjectMapper().readValue(SCOPE_FORMULA_JSON, CbCFormula.class);
    }

    @Test
    void scopeViolationIsEmptyWhenEveryConditionMockWroteIsInScope() throws Exception {
        NarrowedProgram program = NarrowedProgram.of(scopeFormula());

        Assertions.assertTrue(program.scopeViolation("mock", List.of("energyBudget"), false).isEmpty());
    }

    @Test
    void scopeViolationNamesTheIdentifierAndThatItIsTheRoots() throws Exception {
        CbCFormula formula = scopeFormula();
        formula.getVerifiers().put("mock", new VerifierEntry(Condition.fromString("sec == 1"), null, null, null, null, null, null));
        NarrowedProgram program = NarrowedProgram.of(formula);

        String violation = program.scopeViolation("mock", List.of("energyBudget"), false).orElseThrow();

        Assertions.assertTrue(violation.contains("'sec'"), violation);
        Assertions.assertTrue(violation.contains("precondition"), violation);
        Assertions.assertTrue(violation.contains("the Root"), violation);
    }

    @Test
    void scopeViolationNamesTheOffendingStatementAndCoversPrePostAndIntermediate() throws Exception {
        CbCFormula formula = scopeFormula();
        CompositionStatement top = (CompositionStatement) formula.getStatement();
        top.setVerifiers(Map.of("mock",
            new VerifierEntry(null, null, Condition.fromString("sec == 1"), null, null, null, null)));
        NarrowedProgram program = NarrowedProgram.of(formula);

        String violation = program.scopeViolation("mock", List.of("energyBudget"), false).orElseThrow();

        Assertions.assertTrue(violation.contains("'sec'"), violation);
        Assertions.assertTrue(violation.contains("intermediate condition"), violation);
        Assertions.assertTrue(violation.contains("statement 1 ('Comp')"), violation);
    }

    @Test
    void scopeViolationChecksAStatementsPostconditionToo() throws Exception {
        CbCFormula formula = scopeFormula();
        AbstractStatement first = ((CompositionStatement) formula.getStatement()).getFirstStatement();
        first.setVerifiers(Map.of("mock",
            new VerifierEntry(null, Condition.fromString("sec == 1"), null, null, null, null, null)));
        NarrowedProgram program = NarrowedProgram.of(formula);

        String violation = program.scopeViolation("mock", List.of("energyBudget"), false).orElseThrow();

        Assertions.assertTrue(violation.contains("'sec'"), violation);
        Assertions.assertTrue(violation.contains("postcondition"), violation);
        Assertions.assertTrue(violation.contains("statement 2 ('First')"), violation);
    }

    @Test
    void theProgramsOwnVariablesAreInScopeOnlyWhenAllowFunctionalVariablesIsTrue() throws Exception {
        CbCFormula formula = scopeFormula();
        AbstractStatement first = ((CompositionStatement) formula.getStatement()).getFirstStatement();
        first.setVerifiers(Map.of("mock",
            new VerifierEntry(Condition.fromString("i == 0"), null, null, null, null, null, null)));
        NarrowedProgram program = NarrowedProgram.of(formula);

        Assertions.assertTrue(program.scopeViolation("mock", List.of("energyBudget"), true).isEmpty(),
            "'i' is a program variable and the flag is set");

        String violation = program.scopeViolation("mock", List.of("energyBudget"), false).orElseThrow();
        Assertions.assertTrue(violation.contains("'i'"), violation);
    }

    @Test
    void aVerifierWithNoDeclaredVariablesAcceptsLiteralsOnly() throws Exception {
        CbCFormula formula = scopeFormula();
        // Isolate to just the one condition under test: the fixture's own Root and Comp
        // "mock" entries reference "energyBudget", which an empty scope would reject too.
        formula.getVerifiers().remove("mock");
        CompositionStatement top = (CompositionStatement) formula.getStatement();
        top.setVerifiers(null);
        AbstractStatement first = top.getFirstStatement();
        first.setVerifiers(Map.of("mock",
            new VerifierEntry(Condition.fromString("true"), null, null, null, null, null, null)));
        NarrowedProgram program = NarrowedProgram.of(formula);

        Assertions.assertTrue(program.scopeViolation("mock", List.of(), false).isEmpty());

        first.setVerifiers(Map.of("mock",
            new VerifierEntry(Condition.fromString("energyBudget == 0"), null, null, null, null, null, null)));

        Assertions.assertTrue(program.scopeViolation("mock", List.of(), false).isPresent());
    }
}
