package edu.kit.cbc.common.corc.cbcmodel;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import io.micronaut.serde.annotation.Serdeable;

/**
 * One Verifier's condition and result for one statement or for the Root, keyed by Verifier id in
 * {@link AbstractStatement#getVerifiers()} / {@link CbCFormula#getVerifiers()}. Mirrors
 * {@code openapi/schema/cbc/verifiers.yml}. {@code intermediateCondition} only applies to a
 * composition statement and is present only when non-empty.
 *
 * <p>{@code disabled} (with no {@code status}) means this Verifier wasn't enabled for that run.
 * {@code status} is the Verifier's own opaque status text, or the reason it couldn't run at all.
 * On the Root, {@code proven}/{@code status} are the whole-run verdict, not derived from the
 * statements below.
 *
 * <p>{@code settingsUpdatedAt} is an opaque stamp, only ever compared for equality.
 */
@Serdeable
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record VerifierEntry(
    Condition preCondition,
    Condition postCondition,
    Condition intermediateCondition,
    Boolean proven,
    String status,
    Boolean disabled,
    Long settingsUpdatedAt
) {}
