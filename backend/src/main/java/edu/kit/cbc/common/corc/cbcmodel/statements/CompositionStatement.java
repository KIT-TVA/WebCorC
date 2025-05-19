package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CompositionStatement extends AbstractStatement {

    private AbstractStatement firstStatement;
    private AbstractStatement secondStatement;
    private Condition intermediateCondition;

    @Override
    public void prove() {

    }
}
