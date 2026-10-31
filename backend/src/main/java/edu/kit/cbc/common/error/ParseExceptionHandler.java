package edu.kit.cbc.common.error;

import edu.kit.cbc.common.corc.parsing.ParseException;
import io.micronaut.context.annotation.Replaces;
import io.micronaut.core.convert.exceptions.ConversionErrorException;
import io.micronaut.http.HttpRequest;
import io.micronaut.http.HttpResponse;
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Produces;
import io.micronaut.http.server.exceptions.ConversionErrorHandler;
import io.micronaut.http.server.exceptions.ExceptionHandler;
import jakarta.inject.Singleton;

@Singleton
@Produces
@Replaces(ConversionErrorHandler.class)
public class ParseExceptionHandler implements ExceptionHandler<ConversionErrorException, HttpResponse<?>> {

    @Override
    public HttpResponse<?> handle(HttpRequest request, ConversionErrorException exception) {
        ParseException parseEx = findCause(exception, ParseException.class);
        if (parseEx != null) {
            PreExecutionError error = PreExecutionError.fromParseException(parseEx, request.getPath());
            return HttpResponse.badRequest(error).contentType(MediaType.of("application/problem+json"));
        }
        return HttpResponse.badRequest();
    }

    @SuppressWarnings("unchecked")
    private static <T extends Throwable> T findCause(Throwable ex, Class<T> type) {
        Throwable t = ex;
        while (t != null) {
            if (type.isInstance(t)) {
                return (T) t;
            }
            t = t.getCause();
        }
        return null;
    }
}
