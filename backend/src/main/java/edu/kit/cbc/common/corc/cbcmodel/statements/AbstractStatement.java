package edu.kit.cbc.common.corc.cbcmodel.statements;


import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.Representable;
import lombok.Getter;
import lombok.Setter;

/**
 * @author Markus
 * This class holds the implementation of an abstract statement in CorC.
 * It replaces the old EMF version of this class. If any methods or
 * features are missing please refer to the old CorC project and integrate
 * them.
 */
@Getter
@Setter
public abstract class AbstractStatement implements Representable {

  private String name;
  private AbstractStatement refinement;
  private AbstractStatement parent;
  private Condition preCondition;
  private Condition postCondition;
  private String codeRepresentation;
  private boolean isProven;

  public abstract void prove();

  @Override
  public String getCodeRepresentation() {
    return this.codeRepresentation;
  }

  @Override
  public void setCodeRepresentation(String codeRepresentation) {
    this.codeRepresentation = codeRepresentation;
  }
}
