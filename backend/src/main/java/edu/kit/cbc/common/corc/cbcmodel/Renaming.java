package edu.kit.cbc.common.corc.cbcmodel;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Renaming {
    private String type;
    private String function;
    private String newName;
}
