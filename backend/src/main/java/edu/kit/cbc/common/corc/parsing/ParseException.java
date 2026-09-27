package edu.kit.cbc.common.corc.parsing;

import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public class ParseException extends RuntimeException {
    public ParseException(String message) {
        super(message);
    }
}
