package edu.kit.cbc.editor.verifier;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;

/**
 * The Verifier Catalog as served by {@code GET /editor/verifiers}, mirroring
 * {@code openapi/schema/verifiers/verifierCatalog.yml}: the Functional Verifier first, then one
 * entry per registered Verifier in Verifier Registry order.
 *
 * <p>{@code message} is one backend-composed console line naming the Verifiers that are
 * locked off and why, e.g. {@code "2 verifiers unavailable: eebc (unreachable), sec (invalid
 * description)"}; {@code null} — and omitted from the JSON — when every Verifier loaded. The
 * frontend forwards it verbatim and performs no reasoning about it.
 *
 * @param verifiers the Catalog entries, immutable
 * @param message the console line, or {@code null} when nothing is unavailable
 */
@Serdeable
@JsonInclude(JsonInclude.Include.NON_NULL)
public record VerifierCatalog(
    List<Verifier> verifiers,
    String message
) {
    public VerifierCatalog {
        verifiers = List.copyOf(verifiers);
    }
}
