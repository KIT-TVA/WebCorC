package edu.kit.cbc.common.error;

import com.fasterxml.jackson.annotation.JsonInclude;
import edu.kit.cbc.common.corc.parsing.ParseException;
import edu.kit.cbc.common.corc.parsing.SemanticException;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;

@Serdeable
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PreExecutionError(
    String type,
    String title,
    int status,
    String detail,
    String instance,
    List<ErrorDetail> errors
) {
    public enum ErrorType { SYNTACTIC, SEMANTIC }

    @Serdeable
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorDetail(
        String message,
        ErrorType errorType,
        Integer position,
        String input,
        String expected,
        String found,
        String variableName
    ) {}

    public static PreExecutionError fromParseException(ParseException ex, String instance) {
        int pos = ex.getPosition();
        ErrorDetail detail = new ErrorDetail(
            ex.getMessage(),
            ErrorType.SYNTACTIC,
            pos >= 0 ? pos : null,
            ex.getInput(),
            ex.getExpected(),
            ex.getFound(),
            null
        );
        return new PreExecutionError(
            "about:blank",
            "Syntax Error",
            400,
            ex.getMessage(),
            instance,
            List.of(detail)
        );
    }

    public static PreExecutionError fromSemanticException(SemanticException ex, String instance) {
        ErrorDetail detail = new ErrorDetail(
            ex.getMessage(),
            ErrorType.SEMANTIC,
            null,
            null,
            null,
            null,
            ex.getVariableName()
        );
        return new PreExecutionError(
            "about:blank",
            "Semantic Error",
            400,
            ex.getMessage(),
            instance,
            List.of(detail)
        );
    }
}
