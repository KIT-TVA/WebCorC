package edu.kit.cbc.common.corc.cbcmodel.statements;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.StatementType;
import edu.kit.cbc.common.corc.codegeneration.Generatable;
import edu.kit.cbc.common.corc.proof.ProofContext;
import io.micronaut.serde.annotation.Serdeable;
import java.util.Optional;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Serdeable
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({
    @JsonSubTypes.Type(value = Statement.class, name = "STATEMENT"),
    @JsonSubTypes.Type(value = CompositionStatement.class, name = "COMPOSITION_STATEMENT"),
    @JsonSubTypes.Type(value = ReturnStatement.class, name = "RETURN_STATEMENT"),
    @JsonSubTypes.Type(value = SelectionStatement.class, name = "SELECTION_STATEMENT"),
    @JsonSubTypes.Type(value = SkipStatement.class, name = "SKIP_STATEMENT"),
    @JsonSubTypes.Type(value = SmallRepetitionStatement.class, name = "SMALL_REPETITION_STATEMENT")
})
public abstract class AbstractStatement implements Generatable {

    private String name;
    private StatementType type;
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
    protected boolean isProven;

    public abstract boolean prove(ProofContext proofContext);

}
