package edu.kit.cbc.common.corc.cbcmodel.statements;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Statement extends AbstractStatement {
    
    private AbstractStatement refinement;

    @Override
    public void prove() {

    }
}
