package edu.ifbc.common.ifbcmodel.confidentiality;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.util.List;

import org.junit.jupiter.api.Test;

import edu.kit.ifbc.common.ifbcmodel.Lattice;
import edu.kit.ifbc.common.ifbcmodel.Lattice.Level;
import edu.kit.ifbc.common.ifbcmodel.confidentiality.ConfidentialityLattice;

public class ConfidentialityLatticeTest {
    @Test
    public void simple_lattice() {
        // public - 0, private - 1, secret - 2
        ConfidentialityLattice lattice = ConfidentialityLattice.defaultConfidentialityLattice();
        Lattice.Level pub = lattice.levelById(0);
        Lattice.Level priv = lattice.levelById(1);
        Lattice.Level sec = lattice.levelById(2);
        assertEquals(pub, lattice.getMinimalLevel());
        assertEquals(sec, lattice.getMaximalLevel());
        assertEquals(pub, lattice.leastUpperBound(pub, pub, pub));
        assertEquals(priv, lattice.leastUpperBound(pub, priv));
        assertEquals(priv, lattice.leastUpperBound(priv, priv));
        assertEquals(sec, lattice.leastUpperBound(sec, priv));
        assertEquals(sec, lattice.leastUpperBound(sec, sec));
        assertEquals(sec, lattice.leastUpperBound(pub, sec));
        assertEquals(sec, lattice.leastUpperBound(sec, pub));
    }

    @Test
    public void bifurcated_lattice() {
        //    d
        //   / \
        //  b   c
        //   \ /
        //    a
        ConfidentialityLattice lattice = new ConfidentialityLattice(List.of(
            new Lattice.Level(0, "a", List.of(1, 2)),
            new Lattice.Level(1, "b", List.of(3)),
            new Lattice.Level(2, "c", List.of(3)),
            new Lattice.Level(3, "d")
        ));

        Lattice.Level a = lattice.levelById(0);
        Lattice.Level b = lattice.levelById(1);
        Lattice.Level c = lattice.levelById(2);
        Lattice.Level d = lattice.levelById(3);
        assertEquals(a, lattice.getMinimalLevel());
        assertEquals(d, lattice.getMaximalLevel());
        assertEquals(d, lattice.leastUpperBound(b, c));
        assertEquals(d, lattice.leastUpperBound(b, c, a));
        assertEquals(d, lattice.leastUpperBound(b, c, a, d));
        assertEquals(b, lattice.leastUpperBound(a, b));
        assertEquals(c, lattice.leastUpperBound(a, c));
    }

        @Test
    public void complicated_lattice() {
        //    __f
        //   / /|\
        //  | d | e
        //  |/ \|/
        //  b   c
        //   \ /
        //    a
        ConfidentialityLattice lattice = new ConfidentialityLattice(List.of(
            new Lattice.Level(0, "a", List.of(1, 2)),
            new Lattice.Level(1, "b", List.of(3, 5)),
            new Lattice.Level(2, "c", List.of(3, 4, 5)),
            new Lattice.Level(3, "d", List.of(5)),
            new Lattice.Level(4, "e", List.of(5)),
            new Lattice.Level(5, "f")
        ));

        Lattice.Level a = lattice.levelById(0);
        Lattice.Level b = lattice.levelById(1);
        Lattice.Level c = lattice.levelById(2);
        Lattice.Level d = lattice.levelById(3);
        Lattice.Level e = lattice.levelById(4);
        Lattice.Level f = lattice.levelById(5);
        assertEquals(a, lattice.getMinimalLevel());
        assertEquals(f, lattice.getMaximalLevel());
        assertEquals(d, lattice.leastUpperBound(b, c));
        assertEquals(d, lattice.leastUpperBound(b, c, d));
        assertEquals(f, lattice.leastUpperBound(b, e));
    }
}
