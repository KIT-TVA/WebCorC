package edu.kit.ifbc.editor.lattice;

import edu.kit.ifbc.common.dto.VariableStateDTO;
import edu.kit.ifbc.common.ifbcmodel.Lattice;
import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record LatticeDTO(
    VariableStateDTO preVariableState,
    VariableStateDTO postVariableState,
    Lattice lattice
) {}
