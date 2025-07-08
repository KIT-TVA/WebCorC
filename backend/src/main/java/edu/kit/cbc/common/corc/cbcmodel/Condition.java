package edu.kit.cbc.common.corc.cbcmodel;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.kit.cbc.common.corc.parsing.TokenSource;
import edu.kit.cbc.common.corc.parsing.condition.ConditionParser;
import edu.kit.cbc.common.corc.parsing.condition.ConditionPrinter;
import edu.kit.cbc.common.corc.parsing.parser.ast.Tree;
import edu.kit.cbc.common.corc.parsing.condition.ConditionLexer;
import edu.kit.cbc.common.corc.parsing.lexer.Lexer;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Data;

@Data
@Serdeable
public class Condition {

    private static final String OR_SEPARATOR = " | ";
    private static final String AND_SEPARATOR = " & ";
    private static final String BRACKETS = "(%s)";
    private static final String BOOLEAN_TYPE_NAME = "boolean";
    private static final String BOOLEAN_REPLACEMENT = "TRUE=";

    private String condition;
    @JsonIgnore
    private Tree parsedCondition;

    public void setCondition(String condition) {
        this.condition = condition;
        Lexer lexer = ConditionLexer.forString(condition);
        TokenSource source = new TokenSource(lexer);
        ConditionParser parser = new ConditionParser(source);
        this.parsedCondition = parser.parse();
    }

    public String getCondition() {
        return ConditionPrinter.print(parsedCondition);
    }

    public Condition rename(List<Renaming> renamings) {
        renamings.forEach(renaming -> {
            if (renaming.getType().equalsIgnoreCase(BOOLEAN_TYPE_NAME)) {
                this.condition = this.condition.replaceAll(renaming.getFunction(), BOOLEAN_REPLACEMENT + renaming.getNewName());
            } else {
                this.condition = this.condition.replaceAll(renaming.getFunction(), renaming.getNewName());
            }
        });

        return this;
    }

    @Override
    public String toString() {
        return this.condition;
    }

    public static Condition fromListToConditionOr(List<Condition> conditions) {
        return fromListToSeparated(conditions, OR_SEPARATOR);
    }

    public static Condition fromListToConditionAnd(List<Condition> conditions) {
        return fromListToSeparated(conditions, AND_SEPARATOR);
    }

    private static Condition fromListToSeparated(List<Condition> conditions, String separator) {
        String joinedConditionString = conditions.stream()
            .map(Condition::getCondition)
            .map(cond -> String.format(BRACKETS, cond))
            .collect(Collectors.joining(OR_SEPARATOR));

        Condition condition = new Condition();
        condition.setCondition(joinedConditionString);

        return condition;
    }
}
