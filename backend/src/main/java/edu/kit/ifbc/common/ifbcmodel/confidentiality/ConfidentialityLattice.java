package edu.kit.ifbc.common.ifbcmodel.confidentiality;

import java.util.List;

import edu.kit.ifbc.common.ifbcmodel.Lattice;
import io.micronaut.core.annotation.Introspected;
import io.micronaut.serde.annotation.Serdeable;

@Introspected
@Serdeable
public class ConfidentialityLattice extends Lattice {

    public ConfidentialityLattice(List<Lattice.Level> levels) {
        super(levels);
    }

    public static ConfidentialityLattice defaultConfidentialityLattice() {
        return new ConfidentialityLattice(List.of(
            new Lattice.Level(0, "public", List.of(1)),
            new Lattice.Level(1, "private", List.of(2)),
            new Lattice.Level(2, "secret")
        ));

    }

    public static ConfidentialityLattice defaultIntegrityLattice() {
        return new ConfidentialityLattice(List.of(
            new Lattice.Level(0, "")
        ));
    }
}
