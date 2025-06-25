package edu.kit.cbc.common.corc.cbcmodel;

import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Data;

@Data
@Serdeable
public class Condition implements Representable {

    private static final String OR_SEPARATOR = " | ";
    private static final String AND_SEPARATOR = " & ";
    private static final String BRACKETS = "(%s)";
    private static final String BOOLEAN_TYPE_NAME = "boolean";
    private static final String BOOLEAN_REPLACEMENT = "TRUE=";

    private String condition;
    private List<String> modifiables;
    private String codeRepresentation;

    @Override
    public String getCodeRepresentation() {
        return this.codeRepresentation;
    }

    @Override
    public void setCodeRepresentation(String codeRepresentation) {
        this.codeRepresentation = codeRepresentation;
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
