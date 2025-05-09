package edu.kit.cbc.common.corc.cbcmodel;

import com.fasterxml.jackson.annotation.JsonProperty;
import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class CbCFormula {
  private String name;
  private AbstractStatement statement;
  private Condition preCondition;
  private Condition postCondition;

  /*
  WARNING: Jackson will interpret this value as "proven" because the preprocessor automatically removes the "is"
  from the getters name -> "isProven" will be proven. The input JSON must contain proven= instead of isProven.
  Therefore this annotation is important, as it disables this feature. (I spent hours finding this bug ~ Markus)
  */

  @JsonProperty(value = "isProven")
  private boolean isProven;

  @Override
  public String toString() {
    return "CbCFormula [name=" + name + ", statement=" + statement + ", preCondition=" + preCondition + ", " +
            "postCondition=" + postCondition + ", isProven=" + isProven + "]";
  }
}
