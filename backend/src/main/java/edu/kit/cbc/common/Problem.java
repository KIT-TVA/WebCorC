package edu.kit.cbc.common;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Problem(String type, String title, int status, String detail, String instance) {
    public static Problem NOT_IMPLEMENTED = new Problem("about:blank", "Not implemented", 501, "This endpoint has not been implemented yet", "about:blank");

    public static Problem PARSING_ERROR(String detailedError) {
        return new Problem("about:blank", "Parsing error", 501, detailedError, "about:blank");
    }
}
