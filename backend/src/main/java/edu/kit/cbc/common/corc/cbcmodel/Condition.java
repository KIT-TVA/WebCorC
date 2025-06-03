package edu.kit.cbc.common.corc.cbcmodel;

import io.micronaut.serde.annotation.Serdeable;
import java.util.List;
import lombok.Data;

@Data
@Serdeable
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
                this.condition = this.condition.replaceAll(renaming.getFunction(), "TRUE=" + renaming.getNewName());
            } else {
                this.condition = this.condition.replaceAll(renaming.getFunction(), renaming.getNewName());
            }
        });

        return this;
    }

    @Override
    public String toString() {
        return this.condition;
    }
}
