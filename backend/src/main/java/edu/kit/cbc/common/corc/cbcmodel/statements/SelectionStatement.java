package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.proof.ProofContext;
import java.util.List;
import java.util.Optional;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SelectionStatement extends AbstractStatement {
    private List<Condition> guards;
    private List<AbstractStatement> commands;
    private boolean isPreProven;

    @Override
    public boolean prove(ProofContext proofContext) {
        return false;
    }
}
