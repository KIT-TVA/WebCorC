package edu.kit.cbc.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.Renaming;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CbCFormulaContainer {
  private CbCFormula cbcFormula;
  private List<JavaVariable> javaVariables;
  private List<Condition>  globalConditions;
  private List<Renaming> renamings;


  public String toJsonString() {
    return new ObjectMapper().valueToTree(this).toPrettyString();
  }
}
