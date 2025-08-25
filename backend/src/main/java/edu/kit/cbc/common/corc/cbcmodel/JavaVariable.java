package edu.kit.cbc.common.corc.cbcmodel;

import edu.kit.cbc.common.corc.codegeneration.Generatable;
import io.micronaut.serde.annotation.Serdeable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@Getter
@Setter
@NoArgsConstructor
@Serdeable
public class JavaVariable implements Generatable {
    private String variable;
    private JavaVariableKind kind;

    @Override
    public String toString() {
        return this.variable + ";";
    }

    @Override
    public String generate() {
        return this.variable + ";";
    }
}
