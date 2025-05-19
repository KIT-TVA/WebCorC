package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.Condition;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SelectionStatement extends AbstractStatement {
    private List<Condition> guards;
    private List<AbstractStatement> commands;
    private boolean isPreProven;

    @Override
    public void prove() {

    }
}
