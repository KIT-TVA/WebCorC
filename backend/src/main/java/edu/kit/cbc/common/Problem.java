package edu.kit.cbc.common;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Problem(String type, String title, int status, String detail, String instance) {
    public static final Problem NOT_IMPLEMENTED = new Problem(
            "about:blank",
            "Not implemented",
            501,
            "This endpoint has not been implemented yet",
            "about:blank");

    /**
     * Returns a {@link Problem} that includes the details of the parsing error.
     * @param detailedError the description of the error
     * @return the {@link Problem} record that holds all info for the frontend
     */
    public static Problem getParsingError(String detailedError) {
        return new Problem(
                "about:blank",
                "Parsing error",
                501,
                detailedError,
                "about:blank"
        );
    }
}
