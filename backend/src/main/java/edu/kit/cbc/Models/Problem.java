package edu.kit.cbc.Models;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record Problem(String type, String title, int status, String detail, String instance) {
    public static Problem NOT_IMPLEMENTED = new Problem("about:blank", "Not implemented", 501, "This endpoint has not been implemented yet", "about:blank");
}
