package edu.kit.ifbc.editor.lattice;

import java.util.HashMap;

import edu.kit.ifbc.common.ifbcmodel.Lattice;
import io.micronaut.serde.annotation.Serdeable;

@Serdeable
public record PartialLatticeDTO(
    HashMap<String, Integer> preVariableState,
    HashMap<String, Integer> postVariableState,
    Lattice lattice
) {}
