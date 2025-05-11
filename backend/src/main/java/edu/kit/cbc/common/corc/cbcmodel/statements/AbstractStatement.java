package edu.kit.cbc.common.corc.cbcmodel.statements;


import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.cbcmodel.Representable;
import edu.kit.cbc.common.corc.cbcmodel.StatementType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
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
public abstract class AbstractStatement implements Representable {

  private String name;
  private StatementType statementType;
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
