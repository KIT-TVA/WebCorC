package edu.kit.cbc.common.corc.codeGen;

/**
 * Since Key Version 3.12, to access array length in a JML contract, we need to
 * use length(array) instead of array.length
 */
public final class KeYFunctionReplacer {
    private static KeYFunctionReplacer instance;

    private KeYFunctionReplacer() {
    }

    public static KeYFunctionReplacer getInstance() {
        if (instance == null) {
            instance = new KeYFunctionReplacer();
        }
        return instance;
    }

    public String restoreIn(String content) {
        int nextMatch = content.indexOf("length(");
        String identifier;

        while (nextMatch != -1) {
            int matchEnd = findClosingBracketIndex(content, nextMatch + "length".length(), '(');
            identifier = content.substring(nextMatch + "length(".length(), matchEnd);
            content = content.substring(0, nextMatch) + identifier + ".length"
                    + content.substring(matchEnd + 1, content.length());
            nextMatch = content.indexOf("length(");
        }
        return content;
    }

    //Copied and shortened from CodeHandler.java from CorC, to avoid adding the entire file
    public static int findClosingBracketIndex(final String code, final int bracketIndex, char bracket) {
        char closingBracket;
        int bracketCounter = 1;

        closingBracket = ')';

        for (int i = bracketIndex + 1; i < code.length(); i++) {
            if (code.charAt(i) == bracket) {
            bracketCounter++;
            } else if (code.charAt(i) == closingBracket) {
            bracketCounter--;
            }
            if (bracketCounter == 0) {
            return i;
            }
        }
        return -1;
    }
}
