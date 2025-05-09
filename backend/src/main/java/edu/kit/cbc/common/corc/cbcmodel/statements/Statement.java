package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.StatementType;

public class Statement extends AbstractStatement{

  @Override
  public StatementType getStatementType() {
    return StatementType.STATEMENT;
  }

  @Override
  public void prove() {

  }
}
