package edu.kit.cbc.common.corc.cbcmodel.statements;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.StatementType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "statementType")
@JsonSubTypes({
    @JsonSubTypes.Type(value = Statement.class, name = "statement"),
    @JsonSubTypes.Type(value = CompositionStatement.class, name = "composition_statement"),
    @JsonSubTypes.Type(value = ReturnStatement.class, name = "return_statement"),
    @JsonSubTypes.Type(value = SelectionStatement.class, name = "selection_statement"),
    @JsonSubTypes.Type(value = SkipStatement.class, name = "skip_statement"),
    @JsonSubTypes.Type(value = SmallRepetitionStatement.class, name = "small_repetition_statement")
})
public abstract class AbstractStatement {

    private String programStatement;
    private StatementType statementType;
    private Condition preCondition;
    private Condition postCondition;

    /*
     * WARNING: Jackson will interpret this value as "proven" because the
     * preprocessor automatically removes the "is"
     * from the getters name -> "isProven" will be proven. The input JSON must
     * contain proven= instead of isProven.
     * Therefore this annotation is important, as it disables this feature. (I spent
     * hours finding this bug ~ Markus)
     */
    @JsonProperty(value = "isProven", required = true)
    private boolean isProven;

    public abstract void prove();
}
