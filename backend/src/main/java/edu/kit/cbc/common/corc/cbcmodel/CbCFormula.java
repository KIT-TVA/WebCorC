package edu.kit.cbc.common.corc.cbcmodel;

import com.fasterxml.jackson.annotation.JsonProperty;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Serdeable
public class CbCFormula {
    private String name;
    private AbstractStatement statement;
    private List<JavaVariable> javaVariables;
    private List<Condition> globalConditions;
    private List<Renaming> renamings;

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
}
