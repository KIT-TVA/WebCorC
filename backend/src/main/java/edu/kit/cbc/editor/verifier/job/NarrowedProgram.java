package edu.kit.cbc.editor.verifier.job;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.VerifierEntry;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.CompositionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SelectionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SkipStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.SmallRepetitionStatement;
import edu.kit.cbc.common.corc.cbcmodel.statements.Statement;
import edu.kit.cbc.common.corc.parsing.SemanticChecker;
import edu.kit.cbc.common.corc.parsing.SemanticException;
import edu.kit.cbc.editor.verifier.ResolvedVerifier;
import edu.kit.cbc.editor.verifier.VerifierCatalogService;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.logging.Logger;

/**
 * The job's formula as the Verifiers see it: every statement numbered once, in pre-order from
 * 1, so every Verifier is handed the same ids and every result reported against them maps back
 * onto the same statements. See {@link #forVerifier} for how one Verifier's view of the tree is
 * built, and the methods below for how a Verifier's result is written back onto it.
 *
 * <p>The backend's statement model carries no id of its own, hence the numbering here. The
 * program level -- the Root, with its own conditions -- is attributed to id 0 and is a result
 * target in its own right: several of the write methods below record the
 * formula's own {@code verifiers} map alongside, or instead of, the statements'.
 *
 * <p>Every write operation synchronizes on this instance: several Verifiers' results merge into
 * one tree, and a narrowing must not read a {@code verifiers} map another thread is writing.
 */
public final class NarrowedProgram {

    private static final String FUNC = VerifierCatalogService.FUNCTIONAL_VERIFIER_ID;

    private static final Logger LOGGER = Logger.getGlobal();

    private final CbCFormula formula;
    private final Map<Long, AbstractStatement> statementsById = new LinkedHashMap<>();
    private final Map<AbstractStatement, Long> idsByStatement = new IdentityHashMap<>();
    /** Each enabled Verifier's settings stamp, as {@link #resetForRun} was given it; values may be null. */
    private final Map<String, Long> settingsStamps = new HashMap<>();

    private NarrowedProgram(CbCFormula formula) {
        this.formula = formula;
        number(formula.getStatement());
    }

    public static NarrowedProgram of(CbCFormula formula) {
        return new NarrowedProgram(formula);
    }

    private void number(AbstractStatement statement) {
        long id = statementsById.size() + 1;
        statementsById.put(id, statement);
        idsByStatement.put(statement, id);
        for (AbstractStatement child : children(statement)) {
            number(child);
        }
    }

    private static List<AbstractStatement> children(AbstractStatement statement) {
        return switch (statement) {
            case CompositionStatement composition -> List.of(composition.getFirstStatement(), composition.getSecondStatement());
            case SmallRepetitionStatement repetition -> List.of(repetition.getLoopStatement());
            case SelectionStatement selection -> selection.getCommands();
            default -> List.of();
        };
    }

    /** The statement ids in pre-order; the keys a Verifier's result is expected under. */
    List<Long> statementIds() {
        return List.copyOf(statementsById.keySet());
    }

    /**
     * The program with {@code verifierId}'s own Verifier Conditions in the primary condition
     * fields. Of the functional specification only the loops' invariants and variants go along:
     * functional verification has already proven the rest by the time any Verifier runs.
     */
    public synchronized JobProgram forVerifier(String verifierId) {
        VerifierEntry root = entry(formula.getVerifiers(), verifierId);
        List<String> javaVariables = new ArrayList<>();
        for (JavaVariable variable : formula.getJavaVariables() == null ? List.<JavaVariable>of() : formula.getJavaVariables()) {
            javaVariables.add(variable.getName());
        }
        return new JobProgram(
            formula.getName(),
            javaVariables,
            root == null ? null : condition(root.preCondition()),
            root == null ? null : condition(root.postCondition()),
            narrow(formula.getStatement(), verifierId)
        );
    }

    private JobStatement narrow(AbstractStatement statement, String verifierId) {
        long id = idsByStatement.get(statement);
        VerifierEntry entry = entry(statement.getVerifiers(), verifierId);
        JobCondition pre = entry == null ? null : condition(entry.preCondition());
        JobCondition post = entry == null ? null : condition(entry.postCondition());
        String name = statement.getName();
        return switch (statement) {
            case Statement leaf -> JobStatement.statement(id, name, pre, post,
                leaf.getProgramStatement() == null ? "" : leaf.getProgramStatement());
            case SkipStatement skip -> JobStatement.skip(id, name, pre, post);
            case CompositionStatement composition -> JobStatement.composition(id, name, pre, post,
                entry == null ? null : condition(entry.intermediateCondition()),
                narrow(composition.getFirstStatement(), verifierId),
                narrow(composition.getSecondStatement(), verifierId));
            case SelectionStatement selection -> {
                List<JobCondition> guards = new ArrayList<>();
                for (Condition guard : selection.getGuards()) {
                    guards.add(condition(guard));
                }
                List<JobStatement> commands = new ArrayList<>();
                for (AbstractStatement command : selection.getCommands()) {
                    commands.add(narrow(command, verifierId));
                }
                yield JobStatement.selection(id, name, pre, post, guards, commands);
            }
            case SmallRepetitionStatement repetition -> JobStatement.repetition(id, name, pre, post,
                condition(repetition.getGuard()),
                condition(repetition.getInvariant()),
                condition(repetition.getVariant()),
                narrow(repetition.getLoopStatement(), verifierId));
            // ReturnStatement: a backend-only stub the editor cannot create, and one functional
            // verification throws on, so no Verifier is ever started for a program containing one.
            default -> throw new IllegalArgumentException(
                "No Verifier job kind for statement type " + statement.getClass().getSimpleName());
        };
    }

    private static VerifierEntry entry(Map<String, VerifierEntry> verifiers, String verifierId) {
        return verifiers == null ? null : verifiers.get(verifierId);
    }

    private static JobCondition condition(Condition condition) {
        return condition == null ? null : new JobCondition(condition.getCondition());
    }

    /**
     * A message naming the first out-of-scope identifier in one of {@code verifierId}'s own
     * Verifier Conditions, and where it sits.
     */
    public synchronized Optional<String> scopeViolation(
        String verifierId, Collection<String> variableIds, boolean allowFunctionalVariables
    ) {
        Set<String> scope = new HashSet<>(variableIds);
        if (allowFunctionalVariables) {
            scope.addAll(SemanticChecker.javaVariableNames(formula));
        }
        Optional<String> root = scopeViolation(entry(formula.getVerifiers(), verifierId), scope, "the Root");
        if (root.isPresent()) {
            return root;
        }
        for (Map.Entry<Long, AbstractStatement> numbered : statementsById.entrySet()) {
            AbstractStatement statement = numbered.getValue();
            String where = "statement " + numbered.getKey() + " ('" + statement.getName() + "')";
            Optional<String> violation = scopeViolation(entry(statement.getVerifiers(), verifierId), scope, where);
            if (violation.isPresent()) {
                return violation;
            }
        }
        return Optional.empty();
    }

    private static Optional<String> scopeViolation(VerifierEntry entry, Set<String> scope, String where) {
        if (entry == null) {
            return Optional.empty();
        }
        Optional<String> pre = scopeViolation(entry.preCondition(), scope, "precondition", where);
        if (pre.isPresent()) {
            return pre;
        }
        Optional<String> post = scopeViolation(entry.postCondition(), scope, "postcondition", where);
        if (post.isPresent()) {
            return post;
        }
        return scopeViolation(entry.intermediateCondition(), scope, "intermediate condition", where);
    }

    private static Optional<String> scopeViolation(Condition condition, Set<String> scope, String which, String where) {
        if (condition == null) {
            return Optional.empty();
        }
        try {
            SemanticChecker.checkTree(condition.getParsedCondition(), scope);
            return Optional.empty();
        } catch (SemanticException e) {
            return Optional.of(e.getMessage() + " (" + which + " of " + where + ")");
        }
    }

    /**
     * Records the result on the statements' {@code verifiers} entries, keeping the authored
     * conditions; an entry is created where none existed, since a Verifier checks a statement
     * whether or not a condition was written for it. Ids the program never handed out are
     * logged and skipped.
     */
    public synchronized void merge(String verifierId, Map<String, StatementResult> result) {
        for (Map.Entry<String, StatementResult> reported : result.entrySet()) {
            AbstractStatement statement = statementOf(reported.getKey());
            if (statement == null) {
                LOGGER.warning(String.format("Verifier '%s' reported a result for unknown statement id '%s'; ignored",
                    verifierId, reported.getKey()));
                continue;
            }
            setEntry(statement, verifierId, reported.getValue().proven(), reported.getValue().status(), null);
        }
    }

    /**
     * Resets the entry of each id in {@code enabledVerifierIds} ({@code proven: false},
     * {@code status} and {@code disabled} cleared — a Verifier that is about to run) and of each
     * id in {@code disabledVerifierIds} ({@code proven: false}, {@code disabled: true} and no
     * {@code status} — a catalog Verifier not enabled this run), on every statement and on the
     * Root alike, keeping any authored conditions and creating entries where none existed. Called
     * at the start of every run, before functional verification, so that no verdict of an earlier
     * run survives whatever this one does. The Functional Verifier is never touched even if its
     * id is passed in: {@link #writeFunctionalResult} is its only writer.
     *
     * <p>Also records each enabled Verifier's settings stamp: every entry written for it from
     * here on carries that stamp, a disabled entry none.
     */
    public synchronized void resetForRun(Collection<ResolvedVerifier> enabledVerifiers, Collection<String> disabledVerifierIds) {
        for (ResolvedVerifier verifier : enabledVerifiers) {
            settingsStamps.put(verifier.id(), verifier.settingsUpdatedAt());
            markRootAndEveryStatement(verifier.id(), false, null, null);
        }
        markDisabled(disabledVerifierIds);
    }

    /**
     * Marks each id's entry on every statement and on the Root {@code proven: false},
     * {@code disabled: true} with no {@code status} or stamp, keeping any authored conditions —
     * a Verifier that does not run this time, whether not enabled or gated by a functional failure.
     */
    public synchronized void markDisabled(Collection<String> verifierIds) {
        for (String id : verifierIds) {
            settingsStamps.remove(id);
            markRootAndEveryStatement(id, false, null, true);
        }
    }

    /**
     * Writes {@code verifierId}'s whole-run verdict — what it reported with its {@code done} —
     * onto the Root alone, keeping any authored conditions there; the statements carry that
     * Verifier's own per-statement results, written by {@link #merge}. {@code status} is the
     * Verifier's own text for the run, or {@code null} when it sent none.
     */
    public synchronized void writeRootResult(String verifierId, boolean proven, String status) {
        if (FUNC.equals(verifierId)) {
            return;
        }
        setRootEntry(verifierId, proven, status, null);
    }

    /**
     * Marks {@code verifierId}'s entry on every statement and on the Root {@code proven: false}
     * with {@code reason} as its {@code status} and no {@code disabled} marker — it was enabled,
     * it just did not deliver — keeping any authored conditions. How a Verifier whose run failed
     * outright is recorded, since it never reported a result of any kind.
     */
    public synchronized void markFailed(String verifierId, String reason) {
        markRootAndEveryStatement(verifierId, false, reason, null);
    }

    private void markRootAndEveryStatement(String verifierId, boolean proven, String status, Boolean disabled) {
        if (FUNC.equals(verifierId)) {
            return;
        }
        for (AbstractStatement statement : statementsById.values()) {
            setEntry(statement, verifierId, proven, status, disabled);
        }
        setRootEntry(verifierId, proven, status, disabled);
    }

    /**
     * Writes the Functional Verifier's own result-only entry ({@code proven}, never
     * {@code status}, {@code disabled} or conditions) onto every statement, from each statement's own
     * {@code isProven} right after functional verification has completed. Unlike every other
     * Verifier's entry, this one is never reset, marked disabled, or failed by the fan-out — this
     * is its only writer. Overwrites whatever {@code func} entry a statement already carried, so a
     * stale {@code proven: true} from an earlier run can never survive a fresh functional failure.
     */
    public synchronized void writeFunctionalResult() {
        for (AbstractStatement statement : statementsById.values()) {
            setEntry(statement, FUNC, statement.isProven(), null, null);
        }
    }

    /**
     * Writes the Functional Verifier's own result-only entry onto the Root's {@code verifiers}
     * map from the formula's own {@code isProven}. This is a different map from the actual
     * top-level statement's own entry {@link #writeFunctionalResult} already writes: one is the
     * Root's, the other the real top statement's. Whatever else already sits in the Root's map is
     * preserved.
     */
    public synchronized void writeFormulaFunctionalResult() {
        setRootEntry(FUNC, formula.isProven(), null, null);
    }

    /**
     * Recomputes {@code isProven} for every statement, and mirrors the top-level statement's
     * result onto the formula, now that fan-out has finished, been skipped, or failed outright:
     * {@code func.proven && every id in enabledVerifierIds has an own entry with proven == true}.
     * A leaf and a composite are treated alike -- a statement's aggregate never rolls up over its
     * children, it only ever reads its own entries.
     */
    public synchronized void recomputeIsProven(Collection<String> enabledVerifierIds) {
        for (AbstractStatement statement : statementsById.values()) {
            statement.setProven(aggregate(statement.getVerifiers(), enabledVerifierIds));
        }
        formula.setProven(formula.getStatement().isProven());
    }

    private static boolean aggregate(Map<String, VerifierEntry> verifiers, Collection<String> enabledVerifierIds) {
        if (!isProven(entry(verifiers, FUNC))) {
            return false;
        }
        for (String id : enabledVerifierIds) {
            if (!isProven(entry(verifiers, id))) {
                return false;
            }
        }
        return true;
    }

    private static boolean isProven(VerifierEntry entry) {
        return entry != null && Boolean.TRUE.equals(entry.proven());
    }

    private void setEntry(AbstractStatement statement, String verifierId, Boolean proven, String status, Boolean disabled) {
        Map<String, VerifierEntry> verifiers = statement.getVerifiers();
        if (verifiers == null) {
            verifiers = new LinkedHashMap<>();
            statement.setVerifiers(verifiers);
        }
        verifiers.put(verifierId, withResult(verifiers.get(verifierId), proven, status, disabled, stampFor(verifierId, disabled)));
    }

    private void setRootEntry(String verifierId, Boolean proven, String status, Boolean disabled) {
        Map<String, VerifierEntry> verifiers = rootVerifiers();
        verifiers.put(verifierId, withResult(verifiers.get(verifierId), proven, status, disabled, stampFor(verifierId, disabled)));
    }

    /** No stamp on a disabled entry (no result to be stale) or on the Functional Verifier's (no settings). */
    private Long stampFor(String verifierId, Boolean disabled) {
        if (FUNC.equals(verifierId) || Boolean.TRUE.equals(disabled)) {
            return null;
        }
        return settingsStamps.get(verifierId);
    }

    /** The Root's {@code verifiers} map, created on the formula if it had none yet. */
    private Map<String, VerifierEntry> rootVerifiers() {
        Map<String, VerifierEntry> verifiers = formula.getVerifiers();
        if (verifiers == null) {
            verifiers = new LinkedHashMap<>();
            formula.setVerifiers(verifiers);
        }
        return verifiers;
    }

    private static VerifierEntry withResult(VerifierEntry existing, Boolean proven, String status, Boolean disabled,
                                            Long settingsUpdatedAt) {
        return new VerifierEntry(
            existing == null ? null : existing.preCondition(),
            existing == null ? null : existing.postCondition(),
            existing == null ? null : existing.intermediateCondition(),
            proven,
            status,
            disabled,
            settingsUpdatedAt);
    }

    private AbstractStatement statementOf(String id) {
        try {
            return statementsById.get(Long.parseLong(id));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
