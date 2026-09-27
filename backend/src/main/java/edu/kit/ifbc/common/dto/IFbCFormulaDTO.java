package edu.kit.ifbc.common.dto;

import edu.kit.cbc.common.corc.cbcmodel.JavaVariable;
import edu.kit.cbc.common.corc.cbcmodel.Renaming;
import edu.kit.ifbc.common.ifbcmodel.statements.AbstractIFbCStatement;
import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Serdeable
public class IFbCFormulaDTO {
    private String name;
    private AbstractIFbCStatement statement;
    private List<JavaVariable> javaVariables;
    private List<Renaming> renamings;

    private boolean respectsConfidentiality;
}
