package edu.kit.cbc.common.corc.cbcmodel;

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
public class JavaVariable {
    private String variable;
    private JavaVariableKind kind;

    @Override
    public String toString() {
        return this.variable;
    }
}
