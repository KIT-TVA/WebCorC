package edu.kit.cbc.common.corc.cbcmodel;

import java.util.List;
import lombok.Data;

@Data
public class Condition implements Representable {

    private String condition;
    private List<String> modifiables;
    private String codeRepresentation;

    @Override
    public String getCodeRepresentation() {
        return this.codeRepresentation;
    }

    @Override
    public void setCodeRepresentation(String codeRepresentation) {
        this.codeRepresentation = codeRepresentation;
    }

    public Condition rename(List<Renaming> renamings) {
        renamings.forEach(renaming -> {
            if (renaming.getType().equalsIgnoreCase("boolean")) {
                this.condition.replaceAll(renaming.getFunction(), "TRUE=" + renaming.getNewName());
            } else {
                this.condition.replaceAll(renaming.getFunction(), renaming.getNewName());
            }
        });

        return this;
    }
}
