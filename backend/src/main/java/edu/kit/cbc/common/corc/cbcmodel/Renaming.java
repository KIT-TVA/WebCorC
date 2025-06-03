package edu.kit.cbc.common.corc.cbcmodel;

import io.micronaut.serde.annotation.Serdeable;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Serdeable
public class Renaming {
    private String type;
    private String function;
    private String newName;
}
