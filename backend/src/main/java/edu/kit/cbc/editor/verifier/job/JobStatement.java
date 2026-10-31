package edu.kit.cbc.editor.verifier.job;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;

/**
 * One statement of the program a Verifier receives, mirroring
 * {@code openapi/schema/verifiers/job/statement.yml}: the editor model's five kinds, discriminated
 * by {@code type} with the model's own values, flattened into one record the way {@link
 * edu.kit.cbc.editor.verifier.VerifierSetting} flattens the setting kinds — fields a kind does
 * not declare are {@code null} and omitted from the JSON. Build one through the per-kind
 * factories, which take exactly the kind's own fields.
 *
 * <p>{@code preCondition}/{@code postCondition} (and a composition's
 * {@code intermediateCondition}) carry the receiving Verifier's own Verifier Condition and are
 * absent where none was written.
 */
@Serdeable
@JsonInclude(JsonInclude.Include.NON_NULL)
public record JobStatement(
    long id,
    String name,
    String type,
    JobCondition preCondition,
    JobCondition postCondition,
    String programStatement,
    JobCondition intermediateCondition,
    JobStatement firstStatement,
    JobStatement secondStatement,
    List<JobCondition> guards,
    List<JobStatement> commands,
    JobCondition guard,
    JobCondition invariant,
    JobCondition variant,
    JobStatement loopStatement
) {

    public static final String STATEMENT = "STATEMENT";
    public static final String SKIP = "SKIP";
    public static final String COMPOSITION = "COMPOSITION";
    public static final String SELECTION = "SELECTION";
    public static final String REPETITION = "REPETITION";

    public static JobStatement statement(
        long id, String name, JobCondition preCondition, JobCondition postCondition, String programStatement
    ) {
        return new JobStatement(id, name, STATEMENT, preCondition, postCondition, programStatement,
            null, null, null, null, null, null, null, null, null);
    }

    public static JobStatement skip(long id, String name, JobCondition preCondition, JobCondition postCondition) {
        return new JobStatement(id, name, SKIP, preCondition, postCondition, null,
            null, null, null, null, null, null, null, null, null);
    }

    public static JobStatement composition(
        long id, String name, JobCondition preCondition, JobCondition postCondition,
        JobCondition intermediateCondition, JobStatement firstStatement, JobStatement secondStatement
    ) {
        return new JobStatement(id, name, COMPOSITION, preCondition, postCondition, null,
            intermediateCondition, firstStatement, secondStatement, null, null, null, null, null, null);
    }

    /** {@code guards} and {@code commands} pair up by index. */
    public static JobStatement selection(
        long id, String name, JobCondition preCondition, JobCondition postCondition,
        List<JobCondition> guards, List<JobStatement> commands
    ) {
        return new JobStatement(id, name, SELECTION, preCondition, postCondition, null,
            null, null, null, List.copyOf(guards), List.copyOf(commands), null, null, null, null);
    }

    public static JobStatement repetition(
        long id, String name, JobCondition preCondition, JobCondition postCondition,
        JobCondition guard, JobCondition invariant, JobCondition variant, JobStatement loopStatement
    ) {
        return new JobStatement(id, name, REPETITION, preCondition, postCondition, null,
            null, null, null, null, null, guard, invariant, variant, loopStatement);
    }
}
