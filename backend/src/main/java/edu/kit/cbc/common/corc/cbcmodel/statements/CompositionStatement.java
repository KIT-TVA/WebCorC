package edu.kit.cbc.common.corc.cbcmodel.statements;

import edu.kit.cbc.common.corc.cbcmodel.CbCFormula;
import edu.kit.cbc.common.corc.cbcmodel.Condition;
import edu.kit.cbc.common.corc.proof.ProofContext;
import java.util.Optional;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class CompositionStatement extends AbstractStatement {

    private AbstractStatement firstStatement;
    private AbstractStatement secondStatement;
    private Condition intermediateCondition;

    @Override
    public boolean prove(ProofContext proofContext) {
        return false;
    }
}
