package edu.kit.cbc.common;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.JavaVariables;
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
  private JavaVariables javaVariables;
  // Global Conditions
  // Renaming

}
