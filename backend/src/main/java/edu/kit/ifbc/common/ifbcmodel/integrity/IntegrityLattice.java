package edu.kit.ifbc.common.ifbcmodel.integrity;

import java.util.List;

import edu.kit.ifbc.common.ifbcmodel.Lattice;
import io.micronaut.core.annotation.Introspected;
import io.micronaut.serde.annotation.Serdeable;

@Introspected
@Serdeable
public class IntegrityLattice extends Lattice {
    static Lattice.Level TRUSTED = new Lattice.Level(0, "trusted", List.of(1));
    static Lattice.Level UNTRUSTED = new Lattice.Level(1, "untrusted");

    public IntegrityLattice() {
        super(List.of(TRUSTED, UNTRUSTED));
    }
}
