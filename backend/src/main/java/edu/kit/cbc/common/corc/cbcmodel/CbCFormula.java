package edu.kit.cbc.common.corc.cbcmodel;

import edu.kit.cbc.common.corc.cbcmodel.statements.AbstractStatement;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CbCFormula {
  private String name;
  private AbstractStatement statement;
  private Condition preCondition;
  private Condition postCondition;
  private boolean isProven;
}
