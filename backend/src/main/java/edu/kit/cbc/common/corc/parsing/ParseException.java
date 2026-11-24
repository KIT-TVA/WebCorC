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

    public int getPosition() {
        return position;
    }

    public String getInput() {
        return input;
    }

    public String getExpected() {
        return expected;
    }

    public String getFound() {
        return found;
    }
}
