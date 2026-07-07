package edu.kit.cbc.common.corc.parsing;

public class ParseException extends RuntimeException {
    private final int position;
    private final String input;
    private final String expected;
    private final String found;

    public ParseException(String message) {
        super(message);
        this.position = -1;
        this.input = null;
        this.expected = null;
        this.found = null;
    }

    public ParseException(String message, int position, String input, String expected, String found) {
        super(message);
        this.position = position;
        this.input = input;
        this.expected = expected;
        this.found = found;
    }

    public int getPosition() { return position; }
    public String getInput() { return input; }
    public String getExpected() { return expected; }
    public String getFound() { return found; }
}
